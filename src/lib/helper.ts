import Ajv from 'ajv'
import Boom from 'boom'
import Debug from 'debug'
import { List, Map } from 'immutable'
import { IMiddleware, IRouterContext } from 'koa-router'
import Router from 'koa-router'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants'
import { HttpStatusCode } from '../constants/HttpStatusCode'
import { ResponseMetadata, RouteMetadata } from '../decorators'
import { ParamMetadata } from '../decorators/Param'
import { HttpResponse } from './HttpResponse'
import { parseFormData, transform } from './utils'

const debug = Debug('luren')

const ajv = new Ajv()

export const getParams = (ctx: IRouterContext, paramsMetadata: List<ParamMetadata> = List()) => {
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
        if (paramMeta.isFile) {
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
      throw Boom.badRequest(paramMeta.name + ' is required' + (paramMeta.source ? ' in ' + paramMeta.source : ''))
    }
    if (!value) {
      return
    }
    if (paramMeta.schema.type !== 'string' && typeof value === 'string') {
      try {
        value = JSON.parse(value)
      } catch (err) {
        throw Boom.badRequest(`invalid value for argument '${paramMeta.name}'`)
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

export function applyCtrlMiddleware(router: Router, middleware: List<IMiddleware>) {
  middleware.forEach((mw) => {
    router.use(mw)
  })
}

export async function processRoute(ctx: IRouterContext, controller: any, propKey: string, args: any[]) {
  const response = await controller[propKey].apply(controller, args)
  if (response === undefined || response === null) {
    return
  }
  if (response instanceof HttpResponse) {
    ctx.status = response.status
    if (response.headers) {
      ctx.set(response.headers)
    }
    switch (response.status) {
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
    if (resMetadata) {
      if (ajv.validate(resMetadata.schema, response)) {
        ctx.body = transform(response, resMetadata.schema)
      } else {
        throw new Error(ajv.errorsText())
      }
    } else {
      ctx.body = response
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
      if (Boom.isBoom(err)) {
        if (err.isServer) {
          throw err
        } else {
          ctx.status = err.output.statusCode
          const response = !_.isEmpty(err.output.payload.attributes)
            ? err.output.payload.attributes
            : err.output.payload.message
          const resultMetadataMap: Map<number, ResponseMetadata> =
            Reflect.getMetadata(MetadataKey.RESPONSE, controller, propKey) || Map()
          const resMetadata = resultMetadataMap.get(err.output.statusCode)
          if (resMetadata && resMetadata.strict) {
            if (ajv.validate(resMetadata.schema, response)) {
              ctx.body = transform(response, resMetadata.schema)
            } else {
              ctx.body = response
            }
          } else {
            ctx.body = response
          }
        }
      } else {
        throw err
      }
    }
  }
  return action
}

export function createRoute(controller: object, propKey: string, routeMetadata: RouteMetadata) {
  const action = createAction(controller, propKey)
  const middleware: List<IMiddleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, controller, propKey) || List()
  return {
    method: routeMetadata.method.toLowerCase(),
    path: routeMetadata.path,
    action,
    middleware
  }
}

export function createRoutes(controller: object) {
  const routeMetadataMap: Map<string, RouteMetadata> = Reflect.getMetadata(MetadataKey.ROUTES, controller)
  return routeMetadataMap
    .map((routeMetadata, prop) => {
      return createRoute(controller, prop, routeMetadata)
    })
    .toList()
}
export function createController(ctrl: object, onError?: (err: any, ctx: IRouterContext) => void) {
  const router: any = new Router()
  const ctrlMiddleware: List<IMiddleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, ctrl) || List()
  applyCtrlMiddleware(router, ctrlMiddleware)
  const routes = createRoutes(ctrl)
  routes.forEach((route) => {
    const action = async (ctx: Router.IRouterContext, next?: any) => {
      try {
        await route.action(ctx, next)
      } catch (err) {
        debug(err)
        ctx.status = HttpStatusCode.INTERNAL_SERVER_ERROR
        if (onError) {
          onError(err, ctx)
        } else {
          // tslint:disable-next-line:no-console
          console.error(err)
        }
      }
    }
    if (!route.middleware.isEmpty()) {
      router[route.method](route.path, ...route.middleware, action)
    } else {
      router[route.method](route.path, action)
    }
  })
  return router as Router
}
