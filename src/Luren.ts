import Koa from 'koa'
import Router from 'koa-router'
import { importFiles, loadControllers } from './lib/Helper'
interface IMiddlewares {
  session: { pre: any[]; post: any }
  all: { pre: any; post: any[] }
  [key: string]: { pre: any; post: any[]; [key: string]: any[] }
}

export class Luren {
  private koa: Koa
  private router: Router
  private preInit?: (koa: Koa, router: Router) => Promise<void>
  private middlewares: IMiddlewares = {} as any
  constructor(router?: Router, preInit?: (koa: Koa, router: Router) => Promise<void>) {
    this.koa = new Koa()
    this.router = router ? router : new Router()
    this.preInit = preInit
  }
  public applyMiddlewares(...midlewares: any[]): void
  public applyMiddlewares(options: object, ...midlewares: any[]): void
  public applyMiddlewares(arg1: any, arg2: any) {
    if (Array.isArray(arg1)) {
      const middlewares = arg1
      this.middlewares.all.pre.push(...middlewares)
    } else {
      const options = arg1
      const middlewares = arg2
      this.middlewares[options.name][options.phase].push(middlewares)
    }
  }
  public async start(port: number) {
    await this.initialize()
    return new Promise((resolve) => {
      this.koa.listen(port, () => {
        resolve()
      })
    })
  }
  public getKoa() {
    return this.koa
  }
  public getRouter() {
    return this.router
  }
  private async initialize() {
    const koa = this.koa
    const router = this.router
    await importFiles(__dirname)
    if (this.preInit) {
      await this.preInit(koa, router)
    }
    loadControllers(router)
    koa.use(router.routes()).use(router.allowedMethods())
  }
}
