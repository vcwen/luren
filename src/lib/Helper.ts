import Boom from 'boom'
import { List, Map } from 'immutable'
import Router, { IRouterContext } from 'koa-router'
import { get } from 'lodash'
import Path from 'path'
import 'reflect-metadata'
import { HttpStatusCode } from '../constants/HttpStatusCode'
import { MetadataKey } from '../constants/MetadataKey'
import { CtrlMetadata } from '../decorators/Controller'
import { ParamMetadata } from '../decorators/Param'
import { RouteMetadata } from '../decorators/Route'
import { getContainer, getControllerIds } from './global'
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

export function createController(ctrlId: symbol) {
  const router: any = new Router()
  const ctrlMiddlewares: Map<string, any[]> = Map()
  const beforeCtrlMiddlewares = ctrlMiddlewares.get('before') || []
  applyCtrlMiddlewares(router, beforeCtrlMiddlewares)
  const ctrl = getContainer().get(ctrlId)
  const routes = createRoutes(ctrl)
  routes.forEach((route) => {
    const beforeRouteMiddlewares = get(route, 'middlewares.before', [])
    applyRouteMiddlewares(router, beforeRouteMiddlewares, route.method, route.path)
    router[route.method](route.path, route.action)
    const afterRouteMiddlewares = get(route, 'middlewares.after', [])
    applyRouteMiddlewares(router, afterRouteMiddlewares, route.method, route.path)
  })
  const afterCtrlMiddlewares = ctrlMiddlewares.get('after') || []
  applyCtrlMiddlewares(router, afterCtrlMiddlewares)
  return router
}

const getParams = (ctx: IRouterContext, paramsMetadata: List<ParamMetadata> = List()) => {
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
        if (paramMeta.root) {
          value = ctx.request.body
        } else {
          value = ctx.request.body && ctx.request.body[paramMeta.name]
        }

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
    } catch (err) {
      ctx.throw(HttpStatusCode.BAD_REQUEST, err.message)
    }
    return value
  })
}

const processRoute = async (ctx: IRouterContext, controller: any, propKey: string, args: any[]) => {
  const response = await controller[propKey].apply(controller, args)
  if (response instanceof HttpStatus) {
    ctx.status = response.statusCode
    switch (response.statusCode) {
      case HttpStatusCode.MOVED_PERMANENTLY:
      case HttpStatusCode.FOUND:
        return ctx.redirect(response.body)
      default:
        ctx.body = response.body
    }
  } else {
    ctx.body = response
  }
}

export function createAction(controller: object, propKey: string) {
  const paramsMetadata: List<ParamMetadata> =
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
        ctx.throw(err)
      }
    }
  }
  return action
}

export function createRoute(controller: object, propKey: string, ctrlMetadata: CtrlMetadata) {
  const routeMetadata: RouteMetadata = Reflect.getOwnMetadata(
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
    path: Path.join(ctrlMetadata.path, routeMetadata.path),
    action,
    middleware: { before: [], after: [] }
  }
}

export function createRoutes(controller: object): List<any> {
  const ctrlMetadata: CtrlMetadata = Reflect.getMetadata(MetadataKey.CONTROLLER, controller.constructor)
  const props = Object.getOwnPropertyNames(Reflect.getPrototypeOf(controller)).filter((prop) => prop !== 'constructor')
  return List(
    props.map((prop) => {
      return createRoute(controller, prop, ctrlMetadata)
    })
  )
}

export const loadControllers = (router: Router) => {
  const ctrlIds = getControllerIds()
  ctrlIds.forEach((id) => {
    const ctrl = createController(id)
    router.use(ctrl.routes(), ctrl.allowedMethods())
  })
  return router
}
