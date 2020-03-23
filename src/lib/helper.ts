import Ajv from 'ajv'
import safeStringify from 'fast-safe-stringify'
import { List, Map } from 'immutable'
import { Context, Middleware, Request } from 'koa'
import Router from 'koa-router'
import _ from 'lodash'
import { JsTypes } from 'luren-schema'
import { IJsonSchema } from 'luren-schema/dist/types'
import Path from 'path'
import 'reflect-metadata'
import { AuthenticationType, MetadataKey } from '../constants'
import { HttpStatusCode } from '../constants/HttpStatusCode'
import { ActionMetadata, CtrlMetadata, ResponseMetadata } from '../decorators'
import { ParamMetadata } from '../decorators/Param'
import { Luren } from '../Luren'
import { INext } from '../types'
import Action from './Action'
import AuthenticationProcessor from './Authentication'
import AuthorizationProcessor from './Authorization'
import Controller from './Controller'
import { HttpError } from './HttpError'
import { HttpResponse } from './HttpResponse'
import IncomingFile from './IncomingFile'

const ajv = new Ajv({ useDefaults: true })

const getParam = (source: any, metadata: ParamMetadata) => {
  if (metadata.root) {
    return source
  } else {
    return _.get(source, metadata.name)
  }
}

export const getParams = (ctx: Context, next: INext, paramsMetadata: List<ParamMetadata> = List()) => {
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
        return next
      default:
        throw new TypeError('Invalid source:' + metadata.source)
    }
    if (value === undefined) {
      if (metadata.required) {
        throw HttpError.badRequest(metadata.name + ' is required' + (metadata.source ? ' in ' + metadata.source : ''))
      } else {
        return
      }
    }
    // not do type validation when it's built-in object
    if (metadata.root && ['query', 'header', 'context', 'request', 'session', 'next'].includes(metadata.source)) {
      return value
    }
    const schema = metadata.schema
    const jsonSchema: IJsonSchema = JsTypes.toJsonSchema(schema)
    if (jsonSchema.type && jsonSchema.type !== 'string' && typeof value === 'string') {
      try {
        value = JSON.parse(value)
      } catch (err) {
        throw HttpError.badRequest(`invalid value:${value} for argument '${metadata.name}'`)
      }
    }
    const valid = ajv.validate(jsonSchema, value)
    if (!valid) {
      throw HttpError.badRequest(ajv.errorsText())
    }

    try {
      value = JsTypes.deserialize(value, schema, { include: ['virtual'], exclude: ['private'] })
    } catch (err) {
      throw HttpError.badRequest(err)
    }
    return value
  })
}

export function createUserProcess(controller: any, propKey: string) {
  return async function userProcess(ctx: Context, next: INext): Promise<any> {
    const paramsMetadata: List<ParamMetadata> =
      Reflect.getOwnMetadata(MetadataKey.PARAMS, Reflect.getPrototypeOf(controller), propKey) || List()
    const args = getParams(ctx, next, paramsMetadata)
    const response = await controller[propKey].apply(controller, args.toArray())
    if (response === undefined || response === null) {
      return
    }
    if (response instanceof HttpResponse) {
      const header = response.getRawHeader()
      if (header) {
        ctx.set(header)
      }
      switch (response.status) {
        case HttpStatusCode.MOVED_PERMANENTLY:
        case HttpStatusCode.FOUND:
          ctx.redirect(response.body)
          break
        default:
          ctx.body = response.body
      }
      // set status at last, since set body might change the status
      ctx.status = response.status
    } else if (HttpError.isHttpError(response)) {
      const header = response.getRawHeader()
      if (header) {
        ctx.set(header)
      }
      ctx.body = response.getBody()
      ctx.status = response.status
    } else {
      const resultMetadataMap: Map<number, ResponseMetadata> =
        Reflect.getMetadata(MetadataKey.RESPONSE, controller, propKey) || Map()
      const resMetadata = resultMetadataMap.get(HttpStatusCode.OK)

      if (resMetadata) {
        if (!_.isEmpty(resMetadata.headers)) {
          Object.assign(ctx.headers, resMetadata.headers)
        }
        try {
          ctx.body = JsTypes.serialize(response, resMetadata.schema, { exclude: ['private'] })
        } catch (err) {
          throw new Error(
            `${ctx.method.toUpperCase()} ${ctx.path} - unexpected response: ${
              err.message ? err.message : ''
            } \n expected:\n ${safeStringify(resMetadata.schema)} \n actual: \n ${safeStringify(response)}`
          )
        }
      } else {
        ctx.body = response
      }
    }
  }
}

export function createAction(luren: Luren, controller: object, propKey: string, actionMetadata: ActionMetadata) {
  let middleware: List<Middleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, controller, propKey) || List()
  const process = createUserProcess(controller, propKey)
  const action = new Action(luren, actionMetadata.method, actionMetadata.path, process)

  const authentication: AuthenticationProcessor | undefined =
    Reflect.getMetadata(MetadataKey.AUTHENTICATION, controller, propKey) ||
    Reflect.getMetadata(MetadataKey.AUTHENTICATION, controller) ||
    luren.getSecuritySettings().authentication
  if (authentication && authentication.type !== AuthenticationType.NONE) {
    middleware = middleware.unshift(authentication.toMiddleware())
  }
  const authorization: AuthorizationProcessor | undefined =
    Reflect.getMetadata(MetadataKey.AUTHORIZATION, controller, propKey) ||
    Reflect.getMetadata(MetadataKey.AUTHORIZATION, controller) ||
    luren.getSecuritySettings().authorization
  if (authorization) {
    middleware = middleware.push(authorization.toMiddleware())
  }
  action.securitySettings.authentication = authentication
  action.securitySettings.authorization = authorization
  action.middleware = middleware
  return action
}

export function createActions(luren: Luren, controller: object) {
  const actionMetadataMap: Map<string, ActionMetadata> = Reflect.getMetadata(MetadataKey.ACTIONS, controller)
  return actionMetadataMap
    .map((actionMetadata, prop) => {
      return createAction(luren, controller, prop, actionMetadata)
    })
    .toList()
}
export function createController(luren: Luren, ctrl: object) {
  const controller = new Controller(luren)
  const ctrlMetadata: CtrlMetadata = Reflect.getMetadata(MetadataKey.CONTROLLER, ctrl)
  controller.name = ctrlMetadata.name
  controller.plural = ctrlMetadata.plural
  controller.prefix = ctrlMetadata.prefix
  controller.path = ctrlMetadata.path
  controller.version = ctrlMetadata.version
  controller.desc = ctrlMetadata.desc
  controller.middleware = Reflect.getMetadata(MetadataKey.MIDDLEWARE, ctrl) || List()
  const authentication =
    Reflect.getMetadata(MetadataKey.AUTHENTICATION, ctrl) || luren.getSecuritySettings().authentication
  if (authentication) {
    controller.securitySettings.authentication = authentication
  }

  const authorization: AuthorizationProcessor | undefined =
    Reflect.getMetadata(MetadataKey.AUTHORIZATION, ctrl) || luren.getSecuritySettings().authorization
  if (authorization) {
    controller.securitySettings.authorization = authorization
  }

  controller.actions = createActions(luren, ctrl)
  return controller
}

export function createControllerRouter(controller: Controller) {
  const router = new Router({ prefix: controller.prefix })
  router.use(...controller.middleware)
  const pathRegex = /(.+)\/$/
  for (const action of controller.actions) {
    const version = action.version || controller.version || ''
    let path = Path.join('/', version, controller.path, action.path)
    // strip the ending '/'
    const match = pathRegex.exec(path)
    if (match) {
      path = match[1]
    }
    ;(router as any)[action.method.toLowerCase()](path, ...action.middleware, action.process)
  }
  return router
}

export function loadControllersRouter(controllers: List<Controller>) {
  const router = new Router()
  controllers.forEach((ctrl) => {
    const ctrlRouter = createControllerRouter(ctrl)
    router.use(ctrlRouter.routes())
  })
  return router
}

export const getRequestParam = (request: Request, key: string, source: string) => {
  switch (source) {
    case 'header':
      return _.get(request, ['header', key.toLowerCase()])
    case 'path':
      return _.get(request, ['params', key])
    case 'query':
      return _.get(request, ['query', key])
    case 'body':
      return _.get(request, ['body', key])
  }
}
