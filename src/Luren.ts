import Debug from 'debug'
import { List, Map } from 'immutable'
import { Container } from 'inversify'
import Koa from 'koa'
import Router, { IRouterContext } from 'koa-router'
import _ from 'lodash'
import { Server } from 'net'
import Path from 'path'
import { ServiceIdentifier } from './constants/ServiceIdentifier'
import { IDatasource } from './datasource/LurenDatasource'
import { createController } from './lib/helper'
import { getFileLoaderConfig, importModules } from './lib/utils'
const debug = Debug('luren')

export interface IModuleLoaderConfig {
  path: string
  pattern?: { include?: RegExp; exclude?: RegExp }
  filter?: (dir: string, filename: string) => boolean
}
export interface IModuleLoaderOptions {
  path: string
  base?: string
  pattern?: RegExp | { include?: RegExp; exclude?: RegExp }
  filter?: (dir: string, filename: string) => boolean
}

export type IPlugin = (luren: Luren) => void

export class Luren {
  private _prefix: string = '/api'
  private _workDir: string = process.cwd()
  private _koa: Koa
  private _router: Router
  private _container?: Container
  private _bootConfig?: IModuleLoaderConfig
  private _controllers: List<object> = List()
  private _middlewareConfig?: IModuleLoaderConfig
  private _controllerConfig?: IModuleLoaderConfig
  private _modelConfig?: IModuleLoaderConfig
  private _datasource: Map<string, IDatasource> = Map()
  private _onError?: (err: any, ctx: IRouterContext) => void
  constructor(options?: {
    container?: Container
    bootOptions?: IModuleLoaderOptions
    controllerOptions?: IModuleLoaderOptions
    modelOptions?: IModuleLoaderOptions
  }) {
    this._koa = new Koa()
    this._router = new Router({ prefix: this._prefix })
    if (options) {
      this._container = options.container
      if (options.bootOptions) {
        this._bootConfig = getFileLoaderConfig(options.bootOptions)
      }
      if (options.controllerOptions) {
        this._controllerConfig = getFileLoaderConfig(options.controllerOptions)
      }
    }
  }
  public setPrefix(value: string) {
    this._prefix = value
    this._router.prefix(this._prefix)
  }
  public getPrefix() {
    return this._prefix
  }
  public onError(onError: (err: any, ctx: IRouterContext) => void) {
    this._onError = onError
  }
  public setWorkDirectory(dir: string) {
    this._workDir = dir
  }

  public async listen(port: number) {
    try {
      await this._initialize()
      await this._loadBootModules()
      return await new Promise<Server>((resolve) => {
        const server = this._koa.listen(port, () => {
          resolve(server)
        })
      })
    } catch (err) {
      throw err
    }
  }

  public getKoa() {
    return this._koa
  }

  public getControllers() {
    return this._controllers
  }

  public addDatasource(name: string, datasource: IDatasource) {
    this._datasource = this._datasource.set(name, datasource)
  }

  public setDefaultDatasource(datasource: IDatasource) {
    this._datasource = this._datasource.set('default', datasource)
  }

  public registerControllers(...controllers: object[]) {
    this._controllers = this._controllers.concat(controllers)
  }
  public setBootConfig(config: IModuleLoaderOptions) {
    this._bootConfig = getFileLoaderConfig(config)
  }
  public setControllerConfig(config: IModuleLoaderOptions) {
    this._bootConfig = getFileLoaderConfig(config)
  }
  public plugin(...plugins: IPlugin[]) {
    for (const plugin of plugins) {
      plugin(this)
    }
  }

  private async _initialize() {
    await this._loadModelModules()
    await this._loadMiddleware()
    const router = this._router
    await this._loadControllerModules()
    this._loadControllers()
    this._koa.use(router.routes()).use(router.allowedMethods())
  }
  private async _loadMiddleware() {
    const config: IModuleLoaderConfig = this._middlewareConfig || { path: 'middleware' }
    try {
      const modules = await importModules(this._workDir, config)
      for (const module of modules) {
        const middleware = module.default
        if(!middleware) {
          continue
        }
        if (Array.isArray(middleware)) {
          for (const m of middleware) {
            if(typeof m === 'function') {
              this._koa.use(m)
            }
          }
        } else {
          if(typeof middleware === 'function') {
            this._koa.use(middleware)
          }
        }
      }
    } catch (err) {
      if (err.code === 'ENOENT' && err.syscall === 'scandir' && err.path === Path.resolve(this._workDir, config.path)) {
        // tslint:disable-next-line:no-console
        console.warn('No default middleware directory, skip loading middleware')
      } else {
        throw err
      }
    }
  }

  private async _loadBootModules() {
    const config: IModuleLoaderConfig = this._bootConfig || { path: 'boot' }
    try {
      await importModules(this._workDir, config)
    } catch (err) {
      if (err.code === 'ENOENT' && err.syscall === 'scandir' && err.path === Path.resolve(this._workDir, config.path)) {
        // tslint:disable-next-line:no-console
        console.warn('No boot directory, skip loading boot modules')
      } else {
        throw err
      }
    }
  }
  private async _loadControllerModules() {
    const config: IModuleLoaderConfig = this._controllerConfig || { path: 'controllers' }
    try {
      await importModules(this._workDir, config)
    } catch (err) {
      if (err.code === 'ENOENT' && err.syscall === 'scandir' && err.path === Path.resolve(this._workDir, config.path)) {
        // tslint:disable-next-line:no-console
        console.warn('No controllers directory, skip loading controller modules')
      } else {
        throw err
      }
    }
    if (this._container) {
      try {
        const ctrls = this._container.getAll<object>(ServiceIdentifier.CONTROLLER)
        this._controllers = this._controllers.concat(ctrls)
      } catch (err) {
        debug(err)
        // tslint:disable-next-line: no-console
        console.warn('No matching bindings found for Controller')
      }
    }
  }
  private async _loadModelModules() {
    const config: IModuleLoaderConfig = this._modelConfig || { path: 'models' }
    try {
      const modules = await importModules(this._workDir, config)
      for (const module of modules) {
        const model = module.default
        if (!model) {
          break
        }
        for (const ds of this._datasource.values()) {
          ds.loadSchema(model)
        }
      }
    } catch (err) {
      if (err.code === 'ENOENT' && err.syscall === 'scandir' && err.path === Path.resolve(this._workDir, config.path)) {
        // tslint:disable-next-line:no-console
        console.warn('No models directory, skip loading model modules')
      } else {
        throw err
      }
    }
  }
  private _loadControllers() {
    this._controllers.forEach((item) => {
      const ctrl = createController(item, this._onError)
      this._router.use(ctrl.routes(), ctrl.allowedMethods())
    })
  }
}
