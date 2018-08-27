import Boom from 'boom'
import { promises as fs } from 'fs'
import { List, Map } from 'immutable'
import Router, { IRouterContext } from 'koa-router'
import _ from 'lodash'
import { get } from 'lodash'
import nodepath from 'path'
import 'reflect-metadata'
import { HttpStatusCode } from '../constants/HttpStatusCode'
import { MetadataKey } from '../constants/MetadataKey'
import { ICtrlMetadata } from '../decorators/Controller'
import { IParamMetadata } from '../decorators/Param'
import { IRouteMetadata } from '../decorators/Route'
import { Constructor } from '../types/Constructor'
import lurentGlobal from './Global'
import { HttpStatus } from './HttpStatus'
declare module 'koa' {
  // tslint:disable-next-line:interface-name
  interface Request {
    body: any
  }
}

const applyCtrlMiddlewares = (router: Router, middlewares: any[]) => {
  middlewares.forEach((middleware) => {
    router.use(middleware)
  })
}
const applyRouteMiddlewares = (router: Router, middlewares: any[], method: string, path: string) => {
  middlewares.forEach((middleware) => {
    ;(router as any)[method](path, middleware)
  })
}

export function createController(controller: Constructor) {
  const router = new Router()
  const ctrlMiddlewares: Map<string, any[]> = Map()
  const beforeCtrlMiddlewares = ctrlMiddlewares.get('before') || []
  applyCtrlMiddlewares(router, beforeCtrlMiddlewares)
  const routes = createRoutes(new controller())
  routes.forEach((route) => {
    const beforeRouteMiddlewares = get(route, 'middlewares.before', [])
    applyRouteMiddlewares(router, beforeRouteMiddlewares, route.method, route.path)
    ;(router as any)[route.method](route.path, route.action)
    const afterRouteMiddlewares = get(route, 'middlewares.after', [])
    applyRouteMiddlewares(router, afterRouteMiddlewares, route.method, route.path)
  })
  const afterCtrlMiddlewares = ctrlMiddlewares.get('after') || []
  applyCtrlMiddlewares(router, afterCtrlMiddlewares)
  return router
}

const getParams = (ctx: IRouterContext, paramsMetadata: List<IParamMetadata> = List()) => {
  return paramsMetadata.map((paramMeta) => {
    let value: any
    switch (paramMeta.source) {
      case 'query':
        value = ctx.query[paramMeta.name]
        break
      case 'path':
        value = ctx.params[paramMeta.name]
        break
      case 'body':
        value = ctx.request.body[paramMeta.name]
        break
      case 'header':
        value = ctx.header[paramMeta.name]
        break
      case 'context':
        return ctx
      default:
        throw new TypeError('Invalid source:' + paramMeta.source)
    }

    if (paramMeta.required && !value) {
      ctx.throw(HttpStatusCode.BAD_REQUEST, paramMeta.name + ' is required')
    }

    if (!value) {
      return
    }
    if (paramMeta.schema.type !== 'string' && typeof value === 'string') {
      try {
        value = JSON.parse(value)
      } catch (err) {
        ctx.throw(HttpStatusCode.BAD_REQUEST, `invalid value for argument "${paramMeta.name}"`)
      }
    }
    const struct = paramMeta.struct
    try {
      value = struct(value)
    } catch (ex) {
      throw Boom.badRequest(ex)
    }
    return value
  })
}

const processRoute = async (ctx: IRouterContext, controller: object, propKey: string, args: any[]) => {
  const response = await (controller as any)[propKey].apply(controller, args)
  if (response instanceof HttpStatus) {
    ctx.status = response.statusCode
    ctx.body = response.body
    if (response.redirectUrl) {
      ctx.status = response.statusCode
      ctx.redirect(response.redirectUrl)
    }
  } else {
    ctx.body = response
  }
}

export function createAction(controller: object, propKey: string) {
  const paramsMetadata: List<IParamMetadata> =
    Reflect.getOwnMetadata(MetadataKey.PARAM, Reflect.getPrototypeOf(controller), propKey) || List()

  const action = async (ctx: IRouterContext, next?: any) => {
    try {
      const args = getParams(ctx, paramsMetadata)
      await processRoute(ctx, controller, propKey, args.toArray())
      if (next) {
        await next()
      }
    } catch (err) {
      if (Boom.isBoom(err)) {
        ctx.throw(err.output.statusCode, err.message)
      } else {
        throw err
      }
    }
  }
  return action
}

export function createRoute(controller: object, propKey: string, ctrlMetata: ICtrlMetadata) {
  const routeMetadata: IRouteMetadata = Reflect.getOwnMetadata(
    MetadataKey.ROUTE,
    Reflect.getPrototypeOf(controller),
    propKey
  )
  if (!routeMetadata) {
    return
  }
  const action = createAction(controller, propKey)
  return {
    method: routeMetadata.method.toLowerCase(),
    path: nodepath.join(ctrlMetata.path, routeMetadata.path),
    action,
    middleware: { before: [], after: [] }
  }
}

export function createRoutes(controller: object): List<any> {
  const ctrlMetadata: ICtrlMetadata = Reflect.getMetadata(MetadataKey.CONTROLLER, controller.constructor)
  const routes: List<any> = List()
  const props = Object.getOwnPropertyNames(Reflect.getPrototypeOf(controller)).filter((prop) => prop !== 'constructor')
  return routes.withMutations((rs) => {
    for (const prop of props) {
      rs.push(createRoute(controller, prop, ctrlMetadata))
    }
  })
}

export const loadControllers = (router: Router) => {
  const ctrls = lurentGlobal.getControllers()
  ctrls.forEach((item) => {
    const ctrl = createController(item)
    router.use(ctrl.routes(), ctrl.allowedMethods())
  })
  return router
}
export const importFiles = async (root: string) => {
  const paths = await fs.readdir(root)
  for (let path of paths) {
    path = nodepath.resolve(root, path)

    const stat = await fs.lstat(path)
    if (stat.isDirectory()) {
      importFiles(path)
    } else if (stat.isFile()) {
      try {
        if (path.endsWith('.ts') || path.endsWith('.js')) {
          // tslint:disable-next-line:no-console
          // console.log(path)
          await import(path)
        }
      } catch (err) {
        // tslint:disable-next-line:no-console
        console.error(err)
        // ignore the error
      }
    }
  }
}
