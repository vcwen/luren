import Debug from 'debug'
import { List, Map } from 'immutable'
import { Container } from 'inversify'
import { METADATA_KEY } from 'inversify'
import Koa from 'koa'
import mount from 'koa-mount'
import Router, { IRouterContext } from 'koa-router'
import send, { SendOptions } from 'koa-send'
import _ from 'lodash'
import { Server } from 'net'
import Path from 'path'
import { MetadataKey } from './constants/MetadataKey'
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
  disabled?: boolean
  path?: string
  base?: string
  pattern?: RegExp | { include?: RegExp; exclude?: RegExp }
  filter?: (dir: string, filename: string) => boolean
}

export type IPlugin = (luren: Luren) => void

export class Luren {
  private _prefix: string = ''
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
  private _httpServer?: Server
  constructor(options?: {
    container?: Container
    bootOptions?: IModuleLoaderOptions
    middlewareOptions?: IModuleLoaderOptions
    controllerOptions?: IModuleLoaderOptions
    modelOptions?: IModuleLoaderOptions
  }) {
    this._koa = new Koa()
    this._router = new Router()
    if (options) {
      this._container = options.container
      if (options.bootOptions) {
        this._bootConfig = getFileLoaderConfig(options.bootOptions, 'boot')
      }
      if (options.middlewareOptions) {
        this._middlewareConfig = getFileLoaderConfig(options.middlewareOptions, 'middleware')
      }
      if (options.modelOptions) {
        this._modelConfig = getFileLoaderConfig(options.modelOptions, 'models')
      }
      if (options.controllerOptions) {
        this._controllerConfig = getFileLoaderConfig(options.controllerOptions, 'controllers')
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
        this._httpServer = server
      })
    } catch (err) {
      throw err
    }
  }

  public getKoa() {
    return this._koa
  }
  public getRouter() {
    return this._router
  }
  public getHttpServer() {
    return this._httpServer
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
    this._bootConfig = getFileLoaderConfig(config, 'boot')
  }
  public setControllerConfig(config: IModuleLoaderOptions) {
    this._controllerConfig = getFileLoaderConfig(config, 'controllers')
  }
  public plugin(...plugins: IPlugin[]) {
    for (const p of plugins) {
      p(this)
    }
  }

  public use(...middleware: Koa.Middleware[]): Router
  public use(path: string, ...middleware: Koa.Middleware[]): Router
  public use(...args: any[]) {
    if (args.length === 0) {
      return
    }
    const path = args[0]
    if (typeof path === 'string') {
      return this._router.use(path, ..._.tail(args))
    } else {
      return this._router.use(args)
    }
  }

  public serve(path: string, options: SendOptions): void
  public serve(options: SendOptions): void
  public serve(...args: any[]): void {
    let path = '/'
    let options: SendOptions
    if (args.length === 2) {
      ;[path, options] = args
    } else if (args.length === 1) {
      ;[options] = args
    } else {
      throw new Error('Invalid arguments')
    }
    this._koa.use(
      mount(path, async (ctx) => {
        await send(ctx, ctx.path, options)
      })
    )
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
    const config = this._middlewareConfig
    if (!config) {
      return
    }
    try {
      const modules = await importModules(this._workDir, config)
      for (const module of modules) {
        const middleware = module.default
        if (!middleware) {
          continue
        }
        if (Array.isArray(middleware)) {
          for (const m of middleware) {
            if (typeof m === 'function') {
              this._koa.use(m)
            }
          }
        } else {
          if (typeof middleware === 'function') {
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
    const config = this._bootConfig
    if (!config) {
      return
    }
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
    const config = this._controllerConfig
    if (!config) {
      return
    }
    try {
      const modules = await importModules(this._workDir, config)
      for (const module of modules) {
        const Ctrl = module.default
        if (!Ctrl) {
          continue
        }
        const isCtrl = Reflect.hasOwnMetadata(MetadataKey.CONTROLLER, Ctrl.prototype)
        if (isCtrl) {
          const isInjectable = Reflect.hasOwnMetadata(METADATA_KEY.PARAM_TYPES, Ctrl)
          if (isInjectable && this._container) {
            this._container.bind(ServiceIdentifier.CONTROLLER).to(Ctrl)
          } else {
            this._controllers.push(new Ctrl())
          }
        }
      }
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
    const config = this._modelConfig
    if (!config) {
      return
    }
    try {
      const modules = await importModules(this._workDir, config)
      for (const module of modules) {
        const model = module.default
        if (!model) {
          continue
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
