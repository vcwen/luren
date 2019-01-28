import { Map } from 'immutable'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import helmet from 'koa-helmet'
import Router, { IMiddleware } from 'koa-router'
import _ from 'lodash'
import { Server } from 'net'
import { loadControllers } from './lib/Helper'

enum MiddlewareName {
  ALL = 'ALL',
  SECURITY = 'SECURITY',
  BODY_PARSER = 'BODY_PARSER'
}

enum Phase {
  PRE = 'PRE',
  POST = 'POST'
}

export class Luren {
  private _initialized: boolean = false
  private _koa: Koa
  private _router: Router
  private preInit: (app: Luren) => Promise<void>
  // tslint:disable-next-line:ban-types
  private _middlewares: Map<string, { pre: IMiddleware[]; middleware: IMiddleware; post: IMiddleware[] }> = Map()
  constructor(preInit?: (app: Luren) => Promise<void>) {
    this._koa = new Koa()
    this._router = new Router()
    // tslint:disable-next-line:no-empty
    this.preInit = preInit ? preInit : async () => {}
  }
  public async listen(port: number) {
    await this.initialize()
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
    const m: any = this._middlewares.get(name) || { pre: [], post: [], middleware: undefined }
    if (phase) {
      m[phase].push(middleware)
    } else {
      m.middleware = middleware
    }
    this._middlewares = this._middlewares.set(name, m)
  }
  public async initialize() {
    if (this._initialized) {
      return
    }
    const router = this._router
    await this.preInit(this)
    this.use(helmet(), MiddlewareName.SECURITY)
    this.use(bodyParser(), MiddlewareName.BODY_PARSER)
    this._loadMiddlewares()
    loadControllers(router)
    this._koa.use(router.routes()).use(router.allowedMethods())
    this._initialized = true
  }
  private _loadMiddleware(
    name: string,
    options: { pre: boolean; middleware?: boolean; post?: boolean } = { pre: true, middleware: true, post: true }
  ) {
    const item = this._middlewares.get(name)
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
  private _loadMiddlewares() {
    this._loadMiddleware(MiddlewareName.ALL, { pre: true })
    this._loadMiddleware(MiddlewareName.SECURITY)
    this._loadMiddleware(MiddlewareName.BODY_PARSER)
  }
}
