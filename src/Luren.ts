import { List, Map } from 'immutable'
import { Container } from 'inversify'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import helmet from 'koa-helmet'
import Router, { IMiddleware } from 'koa-router'
import _ from 'lodash'
import { Server } from 'net'
import { ServiceIdentifier } from './constants/ServiceIdentifier'
import { loadControllers } from './lib/Helper'
import { getFileLoaderConfig, importFiles } from './lib/utils'

enum MiddlewareName {
  ALL = 'ALL',
  SECURITY = 'SECURITY',
  SESSION = 'SESSION',
  BODY_PARSER = 'BODY_PARSER',
  AUTH = 'AUTH'
}

enum Phase {
  PRE = 'PRE',
  POST = 'POST'
}

export interface IFileLoaderConfig {
  path: string
  pattern: { include?: RegExp; exclude?: RegExp }
}
export interface IFileLoaderOptions {
  path: string
  base?: string
  pattern?: RegExp | { include?: RegExp; exclude?: RegExp }
}

export class Luren {
  private _initialized: boolean = false
  private _koa: Koa
  private _router: Router
  private _container?: Container
  private _bootConfig?: IFileLoaderConfig
  private _controllers: List<object> = List()
  private _middleware: Map<string, { pre: IMiddleware[]; middleware: IMiddleware; post: IMiddleware[] }> = Map()
  private _controllerConfig?: IFileLoaderConfig
  private _hooks: Map<string, (luren: Luren) => any> = Map()
  constructor(options?: { container?: Container; boot: IFileLoaderOptions; controllerOptions?: IFileLoaderOptions }) {
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

  public async listen(port: number) {
    await this._fireHook('pre_init')
    await this._initialize()
    await this._fireHook('post_init')
    await this._fireHook('pre_boot')
    await this._loadBootFiles()
    await this._fireHook('post_boot')
    return new Promise<Server>((resolve) => {
      const server = this._koa.listen(port, () => {
        resolve(server)
      })
    })
  }
  public getRouter() {
    return this._router
  }
  public use(middleware: IMiddleware, name: string = MiddlewareName.ALL, phase?: Phase) {
    if (name === MiddlewareName.ALL && !phase) {
      phase = Phase.POST
    }
    const m: any = this._middleware.get(name) || { pre: [], post: [], middleware: undefined }
    if (phase) {
      m[phase].push(middleware)
    } else {
      m.middleware = middleware
    }
    this._middleware = this._middleware.set(name, m)
  }
  public registerControllers(...controllers: object[]) {
    this._controllers = this._controllers.concat(controllers)
  }
  public setBootConfig(config: IFileLoaderOptions) {
    this._bootConfig = getFileLoaderConfig(config)
  }
  public setControllerConfig(config: IFileLoaderOptions) {
    this._bootConfig = getFileLoaderConfig(config)
  }
  public preInit(hook: (app: Luren) => any) {
    this._hooks.set('pre_init', hook)
  }
  public postInit(hook: (app: Luren) => any) {
    this._hooks.set('post_init', hook)
  }
  public preBoot(hook: (app: Luren) => any) {
    this._hooks.set('pre_boot', hook)
  }
  public postBoot(hook: (app: Luren) => any) {
    this._hooks.set('post_boot', hook)
  }
  private async _initialize() {
    if (this._initialized) {
      return
    }

    this.use(helmet(), MiddlewareName.SECURITY)
    this.use(bodyParser(), MiddlewareName.BODY_PARSER)
    this._loadAllMiddleware()
    if (this._container) {
      const ctrls = this._container.getAll(ServiceIdentifier.CONTROLLER)
      this._controllers = this._controllers.concat(ctrls)
    }
    const router = this._router
    await this._loadControllerFiles()
    loadControllers(router, this._controllers)
    this._koa.use(router.routes()).use(router.allowedMethods())
    this._initialized = true
  }

  private async _fireHook(hook: string) {
    const hookFunc = this._hooks.get(hook)
    if (hookFunc) {
      return hookFunc.call(this, this)
    }
  }

  private _loadMiddleware(
    name: string,
    options: { pre?: boolean; middleware?: boolean; post?: boolean } = { pre: true, middleware: true, post: true }
  ) {
    const item = this._middleware.get(name)
    if (!item) {
      return
    }
    if (options.pre && !_.isEmpty(item.pre)) {
      for (const m of item.pre) {
        this._router.use(m)
      }
    }
    if (options.middleware && item.middleware) {
      this._router.use(item.middleware)
    }
    if (options.post && !_.isEmpty(item.post)) {
      for (const m of item.post) {
        this._router.use(m)
      }
    }
  }
  private _loadAllMiddleware() {
    this._loadMiddleware(MiddlewareName.ALL, { pre: true })
    this._loadMiddleware(MiddlewareName.SECURITY)
    this._loadMiddleware(MiddlewareName.AUTH)
    this._loadMiddleware(MiddlewareName.SESSION)
    this._loadMiddleware(MiddlewareName.BODY_PARSER)
    this._loadMiddleware(MiddlewareName.ALL, { post: true })
  }
  private async _loadBootFiles() {
    if (this._bootConfig) {
      return importFiles(this._bootConfig)
    }
  }
  private async _loadControllerFiles() {
    if (this._controllerConfig) {
      importFiles(this._controllerConfig)
    }
  }
}
