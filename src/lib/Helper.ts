import Boom from 'boom'
import { List, Map } from 'immutable'
import Router, { IRouterContext } from 'koa-router'
import { get } from 'lodash'
import { isEmpty } from 'lodash'
import Path from 'path'
import 'reflect-metadata'
import { HttpStatusCode } from '../constants/HttpStatusCode'
import { MetadataKey } from '../constants/MetadataKey'
import { CtrlMetadata } from '../decorators/Controller'
import { ParamMetadata } from '../decorators/Param'
import { ResultMetadata } from '../decorators/Result'
import { RouteMetadata } from '../decorators/Route'
import { HttpStatus } from './HttpStatus'
import { transform } from './utils'

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

export function createController(ctrl: object) {
  const router = new Router()
  const ctrlMiddlewares: Map<string, any[]> = Map()
  const beforeCtrlMiddlewares = ctrlMiddlewares.get('before') || []
  applyCtrlMiddlewares(router, beforeCtrlMiddlewares)
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
        const request: any = ctx.request
        if (paramMeta.root) {
          value = request.body
        } else {
          value = request.body && request.body[paramMeta.name]
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
  try {
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
      const resultMetadataMap: Map<number, ResultMetadata> =
        Reflect.getMetadata(MetadataKey.RESULT, controller, propKey) || Map()
      const resultMetadata = resultMetadataMap.get(HttpStatusCode.OK)
      if (resultMetadata && resultMetadata.strict) {
        ctx.body = transform(response, resultMetadata.schema, resultMetadata.schema)
      } else {
        ctx.body = response
      }
    }
  } catch (err) {
    if (Boom.isBoom(err)) {
      ctx.status = err.output.statusCode
      const response = !isEmpty(err.output.payload.attributes)
        ? err.output.payload.attributes
        : err.output.payload.message
      const resultMetadataMap: Map<number, ResultMetadata> =
        Reflect.getMetadata(MetadataKey.RESULT, controller, propKey) || Map()
      const resultMetadata = resultMetadataMap.get(err.output.statusCode)
      if (resultMetadata && resultMetadata.strict) {
        ctx.body = transform(response, resultMetadata.schema, resultMetadata.schema)
      } else {
        ctx.body = response
      }
    } else {
      ctx.status = HttpStatusCode.INTERNAL_SERVER_EROR
      ctx.body = err.message || err
    }
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
      ctx.throw(err)
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
  const version = routeMetadata.version || ctrlMetadata.version || ''
  return {
    method: routeMetadata.method.toLowerCase(),
    path: Path.join('/api', version, ctrlMetadata.path, routeMetadata.path),
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

export const loadControllers = (router: Router, controllers: List<object>) => {
  controllers.forEach((item) => {
    const ctrl = createController(item)
    router.use(ctrl.routes(), ctrl.allowedMethods())
  })
  return router
}
