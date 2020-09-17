import { Context, Next } from 'koa'
import { HttpMethod, HttpStatusCode } from '../constants'
import { AppModule } from './AppModule'
import { HttpException } from './HttpException'
import _ from 'lodash'
import { List } from 'immutable'
import { Key, pathToRegexp } from 'path-to-regexp'
import { ControllerModule } from './ControllerModule'
import { ActionModule } from '.'
import { ModuleContext } from './ModuleContext'
import { Middleware } from './Middleware'

export class Route {
  public actionModule: ActionModule
  public method: HttpMethod
  public path: string
  public pathRegExp: RegExp
  public pathParams: (string | number)[]
  public stack: List<(ctx: Context, next: Next) => Promise<any>> = List()
  constructor(actionModule: ActionModule) {
    this.actionModule = actionModule
    const action = async (ctx: Context, next: Next) => {
      return actionModule.actionExecutor.execute(ctx, next)
    }
    const middlewareStack = actionModule.middleware.map((m) => m.toRawMiddleware())
    this.stack = middlewareStack.push(action)
    this.path = actionModule.getFullPath()
    const keys: Key[] = []
    const pathRegExp = pathToRegexp(this.path, keys)
    const pathParams = keys.map((key) => key.name)
    this.pathRegExp = pathRegExp
    this.pathParams = pathParams
    this.method = actionModule.method
  }
  public match(method: HttpMethod, path: string) {
    return this.method.toLocaleLowerCase() === method.toLocaleLowerCase() && this.pathRegExp.test(path)
  }
  public async execute(ctx: Context, externalNext: Next) {
    ctx.moduleContext = new ModuleContext(
      this.actionModule.controllerModule.appModule,
      this.actionModule.controllerModule,
      this.actionModule
    )
    const pathParams = this.pathParams
    if (!_.isEmpty(pathParams)) {
      const params: { [key: string]: string } = {}
      const match = this.pathRegExp.exec(ctx.path) as RegExpExecArray
      for (let i = 0; i < pathParams.length; i++) {
        const paramName = pathParams[i]
        if (typeof paramName === 'string') {
          params[paramName] = match[i + 1]
        }
      }
      ctx.params = params
    }
    const run = this.stack.reduceRight((next, func) => {
      return async () => func(ctx, next)
    }, externalNext)
    return run()
  }
}

// tslint:disable-next-line: max-classes-per-file
export class Router extends Middleware {
  private _routes: List<Route> = List()
  public appModule: AppModule
  constructor(appModule: AppModule) {
    super()
    this.appModule = appModule
  }
  public async execute(ctx: Context, next: Next): Promise<any> {
    return this.dispatch(ctx, next)
  }

  public async dispatch(ctx: Context, next: Next) {
    const route = this._routes.find((r) => r.match(ctx.method as HttpMethod, ctx.path))
    if (route) {
      return route.execute(ctx, next)
    } else {
      await next()
      if (ctx.status === HttpStatusCode.NOT_FOUND) {
        throw new HttpException(HttpStatusCode.NOT_FOUND)
      }
    }
  }
  public registerController(controllerModule: ControllerModule) {
    const routes = controllerModule.actionModules.map((actionModule) => {
      return new Route(actionModule)
    })

    this._routes = this._routes.concat(routes).sort((a, b) => {
      return a.path < b.path ? 1 : -1
    })
  }
  public rebuildRoutes() {
    const routes: Route[] = []
    for (const controllerModule of this.appModule.controllerModules) {
      for (const actionModule of controllerModule.actionModules) {
        const route = new Route(actionModule)
        routes.push(route)
      }
    }
    routes.sort((a, b) => {
      return a.path < b.path ? 1 : -1
    })
    this._routes = List(routes)
  }
}
