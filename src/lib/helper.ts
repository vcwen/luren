import Ajv from 'ajv'
import Boom from 'boom'
import { List, Map } from 'immutable'
import { Context, Middleware, Request } from 'koa'
import Router from 'koa-router'
import _ from 'lodash'
import { deserialize, jsSchemaToJsonSchema, serialize } from 'luren-schema'
import { IJsonSchema } from 'luren-schema/dist/types'
import Path from 'path'
import 'reflect-metadata'
import { AuthenticationType, MetadataKey } from '../constants'
import { HttpStatusCode } from '../constants/HttpStatusCode'
import { ActionMetadata, CtrlMetadata, ResponseMetadata } from '../decorators'
import { ParamMetadata } from '../decorators/Param'
import { Luren } from '../Luren'
import Action from './Action'
import AuthenticationProcessor from './Authentication'
import AuthorizationProcessor from './Authorization'
import Controller from './Controller'
import { HttpResponse } from './HttpResponse'
import IncomingFile from './IncomingFile'
import { JsDataTypes } from './JsDataTypes'

const ajv = new Ajv()

const getParam = (source: any, metadata: ParamMetadata) => {
  if (metadata.root) {
    return source
  } else {
    return _.get(source, metadata.name)
  }
}

export const getParams = (ctx: Context, paramsMetadata: List<ParamMetadata> = List()) => {
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
  return async function userProcess(ctx: Context): Promise<any> {
    const paramsMetadata: List<ParamMetadata> =
      Reflect.getOwnMetadata(MetadataKey.PARAMS, Reflect.getPrototypeOf(controller), propKey) || List()
    const args = getParams(ctx, paramsMetadata)
    const response = await controller[propKey].apply(controller, args.toArray())
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
  const process = async (ctx: Context) => {
    try {
      await userProcess(ctx)
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

export function createAction(luren: Luren, controller: object, propKey: string, actionMetadata: ActionMetadata) {
  let middleware: List<Middleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, controller, propKey) || List()
  const process = createProcess(controller, propKey)
  const action = new Action(luren, actionMetadata.method, actionMetadata.path, process)
  action.middleware = middleware
  const authentication: AuthenticationProcessor | undefined = Reflect.getMetadata(
    MetadataKey.AUTHENTICATION,
    controller,
    propKey
  )
  if (authentication) {
    middleware = middleware.unshift(authentication.toMiddleware())
  }
  const authorization = Reflect.getMetadata(MetadataKey.AUTHORIZATION, controller, propKey)
  if (authorization) {
    middleware = middleware.push(authorization)
  }
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
  let ctrlMiddleware = controller.middleware
  const ctrlAuthentication: AuthenticationProcessor = Reflect.getMetadata(MetadataKey.AUTHENTICATION, controller)

  if (ctrlAuthentication && ctrlAuthentication.type !== AuthenticationType.NONE) {
    ctrlMiddleware = ctrlMiddleware.unshift(ctrlAuthentication.toMiddleware())
  }
  const ctrlAuthorization = controller.securitySettings.authorization
  if (ctrlAuthorization) {
    ctrlMiddleware = ctrlMiddleware.push(ctrlAuthorization.toMiddleware())
  }
  router.use(...ctrlMiddleware)

  for (const action of controller.actions) {
    const version = action.version || controller.version || ''
    const path = Path.join('/', version, controller.path, action.path)
    let middleware = action.middleware
    const authentication = action.securitySettings.authentication

    if (authentication && ctrlAuthentication.type !== AuthenticationType.NONE) {
      middleware = middleware.unshift(authentication.toMiddleware())
    }
    const authorization = action.securitySettings.authorization
    if (authorization) {
      middleware = middleware.push(authorization.toMiddleware())
    }
    ;(router as any)[action.method.toLowerCase()](path, ...middleware, action.process)
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
