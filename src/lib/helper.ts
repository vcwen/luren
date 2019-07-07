import Ajv from 'ajv'
import Boom from 'boom'
import Debug from 'debug'
import { List, Map } from 'immutable'
import { Context, Middleware } from 'koa'
import { IRouterContext } from 'koa-router'
import Router from 'koa-router'
import _ from 'lodash'
import { deserialize, jsSchemaToJsonSchema, serialize, validate } from 'luren-schema'
import { IJsonSchema } from 'luren-schema/dist/types'
import Path from 'path'
import 'reflect-metadata'
import { MetadataKey } from '../constants'
import { HttpStatusCode } from '../constants/HttpStatusCode'
import { ResponseMetadata, RouteMetadata } from '../decorators'
import { ParamMetadata } from '../decorators/Param'
import { Luren } from '../Luren'
import { ISecuritySettings } from '../types'
import Action from './Action'
import Controller from './Controller'
import { HttpResponse } from './HttpResponse'
import IncomingFile from './IncomingFile'
import { JsDataTypes } from './JsDataTypes'

const ajv = new Ajv()

const debug = Debug('luren')

const getParam = (source: any, metadata: ParamMetadata) => {
  if (metadata.root) {
    return source
  } else {
    return _.get(source, metadata.name)
  }
}

export const getParams = (ctx: Context, next: () => any, paramsMetadata: List<ParamMetadata> = List()) => {
  return paramsMetadata.map((metadata) => {
    let value: any
    switch (metadata.source) {
      case 'query':
        value = getParam(ctx.query, metadata)
        break
      case 'path':
        value = getParam(ctx.params, metadata)
        break
      case 'body': {
        if (metadata.schema.type === 'file') {
          if (metadata.root) {
            const ifs: IncomingFile[] = []
            const files = _.get(ctx.request, 'files')
            const props = Object.getOwnPropertyNames(files)
            for (const p of props) {
              const file = files[p]
              const f = new IncomingFile(file.name, file.path, file.type, file.size)
              ifs.push(f)
            }
            value = ifs
          } else {
            const file = _.get(ctx.request, ['files', metadata.name])
            if (file) {
              value = new IncomingFile(file.name, file.path, file.type, file.size)
              return value
            }
          }
        } else {
          value = getParam(_.get(ctx.request, 'body'), metadata)
        }
        break
      }
      case 'header':
        value = getParam(ctx.header, metadata)
        break
      case 'context':
        value = getParam(ctx, metadata)
        break
      case 'session':
        value = getParam(_.get(ctx, 'session'), metadata)
        if (metadata.root) {
          return value
        }
        break
      case 'request':
        value = getParam(ctx.request, metadata)
        if (metadata.root) {
          return value
        }
        break
      case 'next':
        value = next
        return value
      default:
        throw new TypeError('Invalid source:' + metadata.source)
    }
    if (value === undefined) {
      if (metadata.required) {
        throw Boom.badRequest(metadata.name + ' is required' + (metadata.source ? ' in ' + metadata.source : ''))
      } else {
        return
      }
    }
    // not do type validation is it's built-in object
    if (metadata.root && ['query', 'header', 'context', 'request', 'session', 'next'].includes(metadata.source)) {
      return value
    }
    const schema = metadata.schema
    const jsonSchema: IJsonSchema = jsSchemaToJsonSchema(schema, JsDataTypes)
    if (jsonSchema.type && jsonSchema.type !== 'string' && typeof value === 'string') {
      try {
        value = JSON.parse(value)
      } catch (err) {
        throw Boom.badRequest(`invalid value for argument '${metadata.name}'`)
      }
    }
    const valid = ajv.validate(jsonSchema, value)
    if (!valid) {
      throw Boom.badRequest(ajv.errorsText())
    }
    try {
      value = deserialize(schema, value, JsDataTypes)
    } catch (err) {
      throw Boom.badRequest(err)
    }
    return value
  })
}

export function createUserProcess(controller: any, propKey: string) {
  return async function userProcess(ctx: IRouterContext, next: () => Promise<any>): Promise<any> {
    const paramsMetadata: List<ParamMetadata> =
      Reflect.getOwnMetadata(MetadataKey.PARAMS, Reflect.getPrototypeOf(controller), propKey) || List()
    const args = getParams(ctx, next, paramsMetadata)
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
        ctx.body = serialize(resMetadata.schema, response, JsDataTypes)
      } else {
        ctx.body = response
      }
    }
  }
}

export function createProcess(controller: object, propKey: string) {
  const userProcess = createUserProcess(controller, propKey)
  const process = async (ctx: IRouterContext, next: () => Promise<any>) => {
    try {
      const response = await userProcess(ctx, next)
      return response
    } catch (err) {
      if (Boom.isBoom(err)) {
        ctx.status = err.output.statusCode
        const errorData = err.data
        const errorMessage = err.message
        const resultMetadataMap: Map<number, ResponseMetadata> =
          Reflect.getMetadata(MetadataKey.RESPONSE, controller, propKey) || Map()
        const resMetadata = resultMetadataMap.get(err.output.statusCode)
        if (resMetadata) {
          if (resMetadata.schema.type === 'string') {
            ctx.body = errorMessage
          } else {
            ctx.body = serialize(resMetadata.schema, errorData, JsDataTypes)
          }
        } else {
          ctx.body = errorMessage
        }
      } else {
        throw err
      }
    }
  }
  return process
}

export function createAction(luren: Luren, controller: object, propKey: string, routeMetadata: RouteMetadata) {
  const middleware: List<Middleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, controller, propKey) || List()
  const process = createProcess(controller, propKey)
  const action = new Action(luren, routeMetadata.method, routeMetadata.path, process)
  action.middleware = middleware
  return action
}

export function createActions(luren: Luren, controller: object) {
  const routeMetadataMap: Map<string, RouteMetadata> = Reflect.getMetadata(MetadataKey.ROUTES, controller)
  return routeMetadataMap
    .map((routeMetadata, prop) => {
      return createAction(luren, controller, prop, routeMetadata)
    })
    .toList()
}
export function createController(luren: Luren, ctrl: object) {
  const controller = new Controller(luren)
  controller.middleware = Reflect.getMetadata(MetadataKey.MIDDLEWARE, ctrl) || List()
  controller.actions = createActions(luren, ctrl)
  return controller
}

export function createControllerRouter(controller: Controller, securitySettings: ISecuritySettings) {
  const router = new Router({ prefix: controller.prefix })
  router.use(...controller.middleware)

  for (const action of controller.actions) {
    const version = action.version || controller.version || ''
    const path = Path.join('/', version, controller.path, action.path)
    let middleware = action.middleware
    const authentication =
      action.securitySettings.authentication ||
      controller.securitySettings.authentication ||
      securitySettings.authentication

    if (authentication) {
      middleware = middleware.unshift(authentication)
    }
    const authorization =
      action.securitySettings.authorization ||
      controller.securitySettings.authorization ||
      securitySettings.authorization
    if (authorization) {
      middleware = middleware.unshift(...authorization)
    }

    router[action.method](path, ...middleware, action.process)
  }
  return router
}

export function loadControllersRouter(controllers: List<Controller>, securitySettings: ISecuritySettings) {
  const router = new Router()
  controllers.forEach((ctrl) => {
    const ctrlRouter = createControllerRouter(ctrl, securitySettings)
    router.use(ctrlRouter.routes())
  })
  return router
}
