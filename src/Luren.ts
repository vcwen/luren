import Debug from 'debug'
import Koa from 'koa'
import mount from 'koa-mount'
import send, { SendOptions } from 'koa-send'
import _ from 'lodash'
import { MetadataKey } from './constants'
import './lib/DataTypes'
import { createControllerModule } from './lib/helper'
import { Middleware } from './lib/Middleware'
import { Constructor } from './types/Constructor'
import { getFileLoaderConfig, importModules, getClassInstance } from './lib/utils'
import { exceptionHandler } from './middleware/ExceptionHandler'
import { bodyParser } from './middleware/BodyParser'
import helmet from 'koa-helmet'
import { AppModule } from './lib/AppModule'
import { Router } from './lib/Router'
import { ResponseConverter } from './processors'
import { MiddlewarePack } from './lib/MiddlewarePack'

const debug = Debug('luren')

export interface IModuleLoaderConfig {
  path: string
  pattern: string | string[]
  ignore?: string[]
}
export interface IModuleLoaderOptions {
  path?: string
  pattern?: string | string[]
  ignore?: string | string[]
}

export type IPlugin = (luren: Luren) => void
export interface LurenOptions {
  disableResponseConversion?: boolean
}

export class Luren<StateT = any, CustomT = any> extends Koa<StateT, CustomT> {
  private _workDir: string = process.cwd()
  private _appModule: AppModule
  private _router: Router
  private _routerMounted: boolean = false

  constructor(options?: LurenOptions) {
    super()
    this._appModule = new AppModule(this)
    for (const m of [helmet(), exceptionHandler, bodyParser]) {
      super.use(m as any)
    }
    if (!options?.disableResponseConversion) {
      this.useMiddleware(ResponseConverter)
    }
    this._router = new Router(this._appModule)
  }

  public setWorkDirectory(dir: string) {
    this._workDir = dir
  }

  public register(...controllers: (Constructor | object)[]) {
    for (const item of controllers) {
      const ctrl = typeof item === 'object' ? item : getClassInstance(item)
      const ctrlMetadata = Reflect.getMetadata(MetadataKey.CONTROLLER, ctrl)
      if (!ctrlMetadata) {
        throw new TypeError(`invalid controller instance:${ctrl?.constructor?.name}`)
      }
      debug(`register controller ${ctrl.constructor.name}`)
      if (!this._appModule.controllerModules.some((m) => m.controller.constructor === ctrl.constructor)) {
        const ctrlModule = createControllerModule(this._appModule, ctrl)
        this._appModule.controllerModules = this._appModule.controllerModules.push(ctrlModule)
        this._router.registerController(ctrlModule)
      }
    }
    if (!this._routerMounted) {
      this._mountRouter()
    }
  }

  public getAppModule() {
    return this._appModule
  }

  public plugin(...plugins: IPlugin[]) {
    for (const p of plugins) {
      p(this)
    }
  }

  public rebuildRoutes() {
    this._router.rebuildRoutes()
  }

  public useMiddleware(...middleware: (Constructor<Middleware> | Middleware)[]): this {
    const middlewareInstances = middleware.map((m) => {
      if (typeof m === 'function') {
        return getClassInstance<Middleware>(m)
      } else if (m instanceof Middleware) {
        return m
      } else {
        throw TypeError('Invalid middleware type')
      }
    })
    this._appModule.middlewarePacks = this._appModule.middlewarePacks.concat(
      middlewareInstances.map((m) => new MiddlewarePack(m))
    )
    return this
  }

  public useGuards(...guards: (Constructor<Middleware> | Middleware)[]) {
    return this.useMiddleware(...guards)
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
    super.use(mount(path, async (ctx) => send(ctx, ctx.path, options)))
  }

  public async loadMiddlewareModules(options?: IModuleLoaderOptions) {
    const config = getFileLoaderConfig(options, 'middleware')
    const modules = await importModules(this._workDir, config)
    for (const module of modules) {
      let middleware = module.default
      if (!middleware) {
        continue
      }
      if (!Array.isArray(middleware)) {
        middleware = [middleware]
      }
      for (const m of middleware) {
        if (typeof m === 'function' && Middleware.isPrototypeOf(m)) {
          this.useMiddleware(m)
        } else if (m instanceof Middleware) {
          this.useMiddleware(m)
        } else {
          throw TypeError('Invalid middleware type')
        }
      }
    }
  }
  public async loadBootModules(options?: IModuleLoaderOptions) {
    const config = getFileLoaderConfig(options, 'boot')
    importModules(this._workDir, config)
  }
  public async loadControllerModules(options?: IModuleLoaderOptions) {
    const config = getFileLoaderConfig(options, 'controllers')
    const ctrlMods = await importModules(this._workDir, config)
    ctrlMods
      .map((mod) => mod && mod.default)
      .filter((ctrl) => {
        if (typeof ctrl === 'function') {
          return Reflect.hasOwnMetadata(MetadataKey.CONTROLLER, ctrl.prototype)
        } else {
          return false
        }
      })
      .forEach((ctrl) => this.register(ctrl))
  }
  private _mountRouter() {
    this.use(this._router.toRawMiddleware())
  }
}
