import Debug from 'debug'
import Koa from 'koa'
import mount from 'koa-mount'
import send, { SendOptions } from 'koa-send'
import _ from 'lodash'
import { MetadataKey } from './constants'
import { ControllerModule } from './lib/Controller'
import './lib/DataTypes'
import { createControllerModule, createControllerRouter } from './lib/helper'
import { Middleware } from './lib/Middleware'
import { Constructor } from './types/Constructor'
import { getFileLoaderConfig, importModules, getClassInstance, isLurenMiddleware } from './lib/utils'
import { moduleContextInjection } from './middleware/ModuleContext'
import { exceptionHandler } from './middleware/ExceptionHandler'
import { bodyParser } from './middleware/BodyParser'
import { Server } from 'http'
import { ListenOptions } from 'net'
import { ModuleContext } from './lib/ModuleContext'
import { ExecutionLevel } from './constants/ExecutionLevel'
import { ResponseConverter } from './processors/ResponseConverter'
import helmet from 'koa-helmet'

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
  enableResponseConversion?: boolean
}

export class Luren<StateT = any, CustomT = any> extends Koa<StateT, CustomT> {
  private _workDir: string = process.cwd()
  private _controllerModules: Map<Constructor, ControllerModule> = new Map()
  private _httpServer?: Server

  constructor(options?: LurenOptions) {
    super()
    this.use(...[helmet(), exceptionHandler, moduleContextInjection, bodyParser])
    if (!(options?.enableResponseConversion === false)) {
      this.use(new ResponseConverter().toRawMiddleware())
    }
  }

  public setWorkDirectory(dir: string) {
    this._workDir = dir
  }

  // tslint:disable-next-line: unified-signatures
  public async start(port?: number, hostname?: string, backlog?: number): Promise<Server>
  // tslint:disable-next-line: unified-signatures
  public async start(port: number, hostname?: string): Promise<Server>
  // tslint:disable-next-line: unified-signatures
  public async start(port: number, backlog?: number): Promise<Server>
  public async start(port: number): Promise<Server>
  // tslint:disable-next-line: unified-signatures
  public async start(path: string, backlog?: number): Promise<Server>
  // tslint:disable-next-line: unified-signatures
  public async start(path: string): Promise<Server>
  // tslint:disable-next-line: unified-signatures
  public async start(options: ListenOptions): Promise<Server>
  // tslint:disable-next-line: unified-signatures
  public async start(handle: any, backlog?: number): Promise<Server>
  // tslint:disable-next-line: unified-signatures
  public async start(handle: any): Promise<Server>
  async start(...args: any[]): Promise<Server> {
    return new Promise((resolve, reject) => {
      args.push(() => {
        resolve(this._httpServer)
      })
      try {
        this._httpServer = super.listen(...[...args])
      } catch (err) {
        reject(err)
      }
    })
  }

  public close() {
    if (this._httpServer) {
      this._httpServer.close()
    }
  }

  public register(...controllers: (Constructor | object)[]) {
    for (const item of controllers) {
      const ctrl = typeof item === 'object' ? item : getClassInstance(item)
      const ctrlMetadata = Reflect.getMetadata(MetadataKey.CONTROLLER, ctrl)
      if (!ctrlMetadata) {
        throw new TypeError(`invalid controller instance:${ctrl?.constructor?.name}`)
      }
      debug(`register controller ${ctrl.constructor.name}`)
      if (!this._controllerModules.has(ctrl.constructor)) {
        const ctrlModule = createControllerModule(ctrl)
        this._notifyMiddlewareMount(ctrlModule)
        this._controllerModules.set(ctrl.constructor, ctrlModule)
        const ctrlRouter = createControllerRouter(ctrlModule)
        this.use(ctrlRouter.routes()).use(ctrlRouter.allowedMethods())
      }
    }
  }

  public getControllerModules() {
    return this._controllerModules
  }

  public plugin(...plugins: IPlugin[]) {
    for (const p of plugins) {
      p(this as any)
    }
  }

  public use<NewStateT = {}, NewCustomT = {}>(
    ...middleware: (Constructor<Middleware> | Middleware | Koa.Middleware<StateT & NewStateT, CustomT & NewCustomT>)[]
  ): Luren<StateT & NewStateT, CustomT & NewCustomT>
  public use<NewStateT = {}, NewCustomT = {}>(
    path: string,
    ...middleware: Koa.Middleware<StateT & NewStateT, CustomT & NewCustomT>[]
  ): Luren<StateT & NewStateT, CustomT & NewCustomT>
  public use(...args: any[]) {
    let middleware: any[] = []
    let path: any
    if (typeof args[0] === 'string') {
      path = args[0]
      middleware = _.tail(args)
    } else {
      middleware = args
    }
    const moduleCtx = new ModuleContext(this as any)
    const ms = middleware.map((item) => {
      if (item instanceof Middleware) {
        item.onMount(ExecutionLevel.APP, moduleCtx)
        return item.toRawMiddleware()
      } else {
        if (Middleware.isPrototypeOf(item)) {
          const instance = getClassInstance<Middleware>(item)
          instance.onMount(ExecutionLevel.APP, moduleCtx)
          return instance.toRawMiddleware()
        } else {
          return item
        }
      }
    })
    ms.forEach((m) => {
      if (path) {
        super.use(mount(path, m))
      } else {
        super.use(m)
      }
    })
    return this
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
    this.use(mount(path, async (ctx) => send(ctx, ctx.path, options)))
  }

  public async loadMiddleware(options?: IModuleLoaderOptions) {
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
        if (typeof m === 'function') {
          if (Middleware.isPrototypeOf(m)) {
            const instance = getClassInstance<Middleware>(m)
            this.use(instance.toRawMiddleware())
          } else {
            this.use(m)
          }
        } else if (m instanceof Middleware) {
          this.use(m.toRawMiddleware())
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
  private _notifyMiddlewareMount(controllerModule: ControllerModule) {
    for (const m of controllerModule.middleware) {
      if (isLurenMiddleware(m)) {
        m.onMount(ExecutionLevel.CONTROLLER, new ModuleContext(this, controllerModule))
      }
    }
    for (const actionModule of controllerModule.actionModules) {
      for (const m of actionModule.middleware) {
        if (isLurenMiddleware(m)) {
          m.onMount(ExecutionLevel.ACTION, new ModuleContext(this, controllerModule, actionModule))
        }
      }
    }
  }
}
