import Ajv from 'ajv'
import Boom from 'boom'
import { List, Map } from 'immutable'
import Router, { IRouterContext } from 'koa-router'
import { isEmpty } from 'lodash'
import Path from 'path'
import 'reflect-metadata'
import { Phase } from '../constants'
import { HttpStatusCode } from '../constants/HttpStatusCode'
import { MetadataKey } from '../constants/MetadataKey'
import { CtrlMetadata } from '../decorators/Controller'
import { ParamMetadata } from '../decorators/Param'
import { ResponseMetadata } from '../decorators/Response'
import { RouteMetadata } from '../decorators/Route'
import { Luren } from '../Luren'
import { HttpStatus } from './HttpStatus'
import { parseFormData, transform } from './utils'
const ajv = new Ajv()

const applyCtrlMiddleware = (router: Router, middleware: any[]) => {
  middleware.forEach((mw) => {
    router.use(mw)
  })
}
const applyRouteMiddleware = (router: Router, middleware: any[], method: string, path: string) => {
  middleware.forEach((mv) => {
    ;(router as any)[method](path, mv)
  })
}

export function createController(luren: Luren, ctrl: object) {
  const router = new Router()
  const ctrlMiddleware: Map<string, any[]> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, ctrl) || Map()
  const beforeCtrlMiddleware = ctrlMiddleware.get(Phase.PRE) || []
  applyCtrlMiddleware(router, beforeCtrlMiddleware)
  const routes = createRoutes(luren, ctrl)
  routes.forEach((route) => {
    if (!route) {
      return
    }
    const beforeRouteMiddleware = route.middleware.get(Phase.PRE) || []
    applyRouteMiddleware(router, beforeRouteMiddleware, route.method, route.path)
    router[route.method](route.path, route.action)
    const afterRouteMiddleware = route.middleware.get(Phase.POST) || []
    applyRouteMiddleware(router, afterRouteMiddleware, route.method, route.path)
  })
  const afterCtrlMiddleware = ctrlMiddleware.get(Phase.POST) || []
  applyCtrlMiddleware(router, afterCtrlMiddleware)
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
      case 'body': {
        const request: any = ctx.request
        if (paramMeta.schema.type === 'string' && paramMeta.schema.format === 'binary') {
          if (paramMeta.root) {
            value = request.files
          } else {
            value = request.files && request.files[paramMeta.name]
          }
        } else {
          if (paramMeta.root) {
            value = request.body
          } else {
            value = request.body && request.body[paramMeta.name]
          }
        }
        break
      }
      case 'header':
        value = ctx.header[paramMeta.name]
        break
      case 'context':
        return ctx
      default:
        throw new TypeError('Invalid source:' + paramMeta.source)
    }

    if (paramMeta.required && !value) {
      ctx.throw(
        HttpStatusCode.BAD_REQUEST,
        paramMeta.name + ' is required' + (paramMeta.source ? ' in ' + paramMeta.source : '')
      )
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
    const schema = paramMeta.schema
    const valid = ajv.validate(schema, value)
    if (!valid) {
      throw Boom.badRequest(ajv.errorsText())
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
      const resultMetadataMap: Map<number, ResponseMetadata> =
        Reflect.getMetadata(MetadataKey.RESPONSE, controller, propKey) || Map()
      const resMetadata = resultMetadataMap.get(HttpStatusCode.OK)
      if (resMetadata && resMetadata.strict) {
        if (ajv.validate(resMetadata.schema, response)) {
          ctx.body = transform(response, resMetadata.schema, resMetadata.schema)
        } else {
          throw Boom.internal('Invalid response data')
        }
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
      const resultMetadataMap: Map<number, ResponseMetadata> =
        Reflect.getMetadata(MetadataKey.RESPONSE, controller, propKey) || Map()
      const resMetadata = resultMetadataMap.get(err.output.statusCode)
      if (resMetadata && resMetadata.strict) {
        if (ajv.validate(resMetadata.schema, response)) {
          ctx.body = transform(response, resMetadata.schema, resMetadata.schema)
        } else {
          ctx.body = response
        }
      } else {
        ctx.body = response
      }
    } else {
      ctx.status = HttpStatusCode.INTERNAL_SERVER_ERROR
      ctx.body = err.message || err
    }
  }
}

export function createAction(controller: object, propKey: string) {
  const paramsMetadata: List<ParamMetadata> =
    Reflect.getOwnMetadata(MetadataKey.PARAMS, Reflect.getPrototypeOf(controller), propKey) || List()

  const action = async (ctx: IRouterContext, next?: any) => {
    try {
      if (!ctx.disableFormParser && ctx.is('multipart/form-data')) {
        const { fields, files } = await parseFormData(ctx)
        const request: any = ctx.request
        request.body = fields
        request.files = files
      }
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

export function createRoute(luren: Luren, controller: object, propKey: string, ctrlMetadata: CtrlMetadata) {
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
  const middleware: Map<string, any[]> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, controller, propKey) || Map()
  return {
    method: routeMetadata.method.toLowerCase(),
    path: Path.join(luren.routerPrefix, version, ctrlMetadata.path, routeMetadata.path),
    action,
    middleware
  }
}

export function createRoutes(luren: Luren, controller: object) {
  const ctrlMetadata: CtrlMetadata = Reflect.getMetadata(MetadataKey.CONTROLLER, controller.constructor)
  const props = Object.getOwnPropertyNames(Reflect.getPrototypeOf(controller)).filter((prop) => prop !== 'constructor')
  return List(
    props.map((prop) => {
      return createRoute(luren, controller, prop, ctrlMetadata)
    })
  )
}

export const loadControllers = (luren: Luren, router: Router, controllers: List<object>) => {
  controllers.forEach((item) => {
    const ctrl = createController(luren, item)
    router.use(ctrl.routes(), ctrl.allowedMethods())
  })
  return router
}
