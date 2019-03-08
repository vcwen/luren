import { List, Map } from 'immutable'
import { Container } from 'inversify'
import Koa from 'koa'
import Router from 'koa-router'
import _ from 'lodash'
import { Server } from 'net'
import { ServiceIdentifier } from './constants/ServiceIdentifier'
import { loadControllers } from './lib/Helper'
import { getFileLoaderConfig, importModules } from './lib/utils'

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

export class Luren {
  private _workDir: string = process.cwd()
  private _koa: Koa
  private _router: Router
  private _container?: Container
  private _bootConfig?: IModuleLoaderConfig
  private _controllers: List<object> = List()
  private _middlewareConfig?: IModuleLoaderConfig
  private _controllerConfig?: IModuleLoaderConfig
  constructor(options?: {
    container?: Container
    boot: IModuleLoaderOptions
    controllerOptions?: IModuleLoaderOptions
  }) {
    this._koa = new Koa()
    this._router = new Router()
    if (options) {
      this._container = options.container
      if (options.boot) {
        this._bootConfig = getFileLoaderConfig(options.boot)
      }
      if (options.controllerOptions) {
        this._controllerConfig = getFileLoaderConfig(options.controllerOptions)
      }
    }
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
  public getRouter() {
    return this._router
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
  private async _initialize() {
    await this._loadMiddleware()
    if (this._container) {
      const ctrls = this._container.getAll(ServiceIdentifier.CONTROLLER)
      this._controllers = this._controllers.concat(ctrls)
    }
    const router = this._router
    await this._loadControllerModules()
    loadControllers(router, this._controllers)
    this._koa.use(router.routes()).use(router.allowedMethods())
  }

  private async _loadMiddleware() {
    let config: IModuleLoaderConfig
    let useDefault: boolean
    if (this._middlewareConfig) {
      config = this._middlewareConfig
      useDefault = false
    } else {
      config = { path: 'middleware' }
      useDefault = true
    }
    try {
      await importModules(this._workDir, config, async (module: any) => {
        const middleware = module.default
        if (Array.isArray(middleware)) {
          for (const m of middleware) {
            this._koa.use(m)
          }
        } else {
          this._koa.use(middleware)
        }
      })
    } catch (err) {
      if (useDefault) {
        // tslint:disable-next-line:no-console
        console.warn('Failed to load default middleware')
        // tslint:disable-next-line:no-console
        console.warn(err)
      } else {
        throw err
      }
    }
  }

  private async _loadBootModules() {
    let config: IModuleLoaderConfig
    let useDefault: boolean
    if (this._bootConfig) {
      config = this._bootConfig
      useDefault = false
    } else {
      config = { path: 'boot' }
      useDefault = true
    }
    try {
      await importModules(this._workDir, config)
    } catch (err) {
      if (useDefault) {
        // tslint:disable-next-line:no-console
        console.warn('Failed to load default boot modules')
        // tslint:disable-next-line:no-console
        console.warn(err)
      } else {
        throw err
      }
    }
  }
  private async _loadControllerModules() {
    let config: IModuleLoaderConfig
    let useDefault: boolean
    if (this._controllerConfig) {
      config = this._controllerConfig
      useDefault = false
    } else {
      config = { path: 'controllers' }
      useDefault = true
    }
    try {
      await importModules(this._workDir, config)
    } catch (err) {
      if (useDefault) {
        // tslint:disable-next-line:no-console
        console.warn('Failed to load default controller modules')
        // tslint:disable-next-line:no-console
        console.warn(err)
      } else {
        throw err
      }
    }
  }
}
