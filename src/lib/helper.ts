import { List, Map } from 'immutable'
import { Context, Middleware as KoaMiddleware, Request } from 'koa'
import Router from '@koa/router'
import _ from 'lodash'
import { JsTypes, IJsSchema, utils } from 'luren-schema'
import Path from 'path'
import 'reflect-metadata'
import { MetadataKey, ParamSource } from '../constants'
import { ActionMetadata, CtrlMetadata, ResponseMetadata } from '../decorators'
import { ParamMetadata } from '../decorators/Param'
import { INext } from '../types'
import { ActionModule } from './Action'
import { ControllerModule } from './Controller'
import { HttpException } from './HttpException'
import { IncomingFile } from './IncomingFile'
import { Middleware } from './Middleware'
import { GuardGroup } from '../processors/Guard'
import { GenericType } from './GenericType'
import { normalizeHeaderCase } from './utils'
import mime from 'mime-types'
import { ParamInfo } from './ParamInfo'
import { ResponseInfo } from './ResponseInfo'

const getParam = (source: any, metadata: ParamInfo) => {
  if (metadata.root) {
    return source
  } else {
    return _.get(source, metadata.name)
  }
}

export const getParams = (ctx: Context, next: INext, paramsMetadata: List<ParamInfo> = List()) => {
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
        break
      case 'request':
        value = getParam(ctx.request, metadata)
        break
      case 'next':
        return next
      default:
        throw new TypeError('Invalid source:' + metadata.source)
    }
    if (value === undefined) {
      if (metadata.required) {
        throw HttpException.badRequest(
          metadata.name + ' is required' + (metadata.source ? ' in ' + metadata.source : '')
        )
      } else {
        return
      }
    }
    // not do type validation when it's built-in object
    if (metadata.root && ['query', 'header', 'context', 'request', 'session', 'next'].includes(metadata.source)) {
      if (metadata.schema.type === 'object' && !_.isEmpty(value)) {
        const properties = metadata.schema.properties
        if (properties) {
          const obj = {} as any
          const props = Object.keys(properties)
          for (const prop of props) {
            if (
              properties[prop].type !== 'any' &&
              properties[prop].type !== 'string' &&
              typeof value[prop] === 'string'
            ) {
              try {
                obj[prop] = JSON.parse(value[prop])
              } catch (err) {
                throw HttpException.badRequest(
                  `invalid value: '${value[prop]}' for argument '${metadata.name}.${prop}'`
                )
              }
            }
          }
          if (_.isEmpty(obj)) {
            value = null
          } else {
            value = obj
          }
        } else {
          return value
        }
      } else {
        throw new TypeError(`schema type must be object if it's root type`)
      }
    }
    const schema = metadata.schema
    if (schema.type !== 'any' && schema.type !== 'string' && typeof value === 'string') {
      try {
        value = JSON.parse(value)
      } catch (err) {
        throw HttpException.badRequest(`invalid value: '${value}' for argument '${metadata.name}'`)
      }
    }
    try {
      value = JsTypes.deserialize(value, schema)
    } catch (err) {
      throw HttpException.badRequest(err)
    }
    return value
  })
}

const generateParamInfo = (paramMetadata: ParamMetadata, genericParams: Map<string, any>): ParamInfo => {
  let paramSchema: IJsSchema
  let paramRequired = paramMetadata.required
  if (paramMetadata.schema) {
    paramSchema = paramMetadata.schema
    if (paramRequired === undefined) {
      paramRequired = true
    }
  } else {
    const [schema, required] = utils.convertSimpleSchemaToJsSchema(paramMetadata.type ?? 'string', (simpleSchema) => {
      if (simpleSchema instanceof GenericType) {
        return simpleSchema.getActualType(genericParams.toObject())
      } else {
        return simpleSchema
      }
    })
    paramSchema = schema
    if (paramRequired === undefined) {
      paramRequired = required
    }
  }
  const info = new ParamInfo(
    paramMetadata.name ?? '',
    paramMetadata.source || ParamSource.QUERY,
    paramSchema,
    paramRequired
  )
  info.root = paramMetadata.root || false
  if (paramMetadata.format) {
    info.format = paramMetadata.format
  }
  if (paramMetadata.desc) {
    info.desc = paramMetadata.desc
  }
  if (paramMetadata.mime) {
    info.mime = paramMetadata.mime
  }
  if (paramMetadata.default) {
    info.default = paramMetadata.default
  }
  if (paramMetadata.example) {
    const vr = JsTypes.validate(paramMetadata.example, paramSchema)
    if (!vr.valid) {
      throw vr.error!
    } else {
      info.example = paramMetadata.example
    }
  }
  return info
}

const getParamInfos = (target: object, prop: string, actionOwner: object, genericParams: Map<string, any> = Map()) => {
  let paramInfos: List<ParamInfo> = List()
  while (true) {
    const paramsMetadata: List<ParamMetadata> | undefined = Reflect.getOwnMetadata(MetadataKey.PARAMS, target, prop)
    if (paramsMetadata) {
      paramInfos = paramsMetadata.map((metadata) => generateParamInfo(metadata, genericParams))
      return paramInfos
    }
    if (target === actionOwner) {
      break
    } else {
      target = Reflect.getPrototypeOf(target)
    }
  }
  return paramInfos
}

const generateResponseInfo = (responseMetadata: ResponseMetadata, genericParams: Map<string, any>) => {
  const status = responseMetadata.status
  let responseSchema: IJsSchema
  let responseRequired = responseMetadata.required
  if (responseMetadata.schema) {
    responseSchema = responseMetadata.schema
    if (responseRequired === undefined) {
      responseRequired = true
    }
  } else {
    const [schema, required] = utils.convertSimpleSchemaToJsSchema(
      responseMetadata.type || 'string',
      (simpleSchema) => {
        if (simpleSchema instanceof GenericType) {
          return simpleSchema.getActualType(genericParams.toObject())
        } else {
          return simpleSchema
        }
      }
    )
    responseSchema = schema
    if (responseRequired === undefined) {
      responseRequired = required
    }
  }

  const responseInfo = new ResponseInfo(status, responseSchema, responseRequired, responseMetadata.desc)
  responseInfo.headers = normalizeHeaderCase(responseMetadata.headers || {})

  if (responseMetadata.example) {
    const vr = JsTypes.validate(responseMetadata.example, responseSchema)
    if (!vr.valid) {
      throw vr.error!
    } else {
      responseInfo.example = responseMetadata.example
    }
  }

  if (responseMetadata.contentType) {
    const contentType = mime.contentType(responseMetadata.contentType)
    Reflect.set(responseInfo.headers, 'Content-Type', contentType ? contentType : responseMetadata.contentType)
  }
  if ((responseSchema.type === 'file' || responseSchema.type === 'stream') && !responseInfo.headers['Content-Type']) {
    Reflect.set(responseInfo.headers, 'Content-Type', 'application/octet-stream')
  }
  return responseInfo
}

const getResponseInfos = (
  target: object,
  prop: string,
  actionOwner: object,
  genericParams: Map<string, any> = Map()
) => {
  let responses: Map<number, ResponseInfo> = Map()
  while (true) {
    const responsesMetadata: Map<number, ResponseMetadata> | undefined = Reflect.getOwnMetadata(
      MetadataKey.RESPONSE,
      target,
      prop
    )
    if (responsesMetadata) {
      responses = responsesMetadata.map((metadata) => generateResponseInfo(metadata, genericParams))
    }
    if (target === actionOwner) {
      break
    } else {
      target = Reflect.getPrototypeOf(target)
    }
  }
  return responses
}

const getActionMetadata = (target: object, prop: string): [ActionMetadata, object] => {
  let actionMetadata: ActionMetadata
  do {
    actionMetadata = Reflect.getOwnMetadata(MetadataKey.ACTION, target, prop)
    if (!actionMetadata) {
      target = Reflect.getPrototypeOf(target)
    }
  } while (!actionMetadata)
  return [actionMetadata, target]
}

export function createActionModule(controller: object, propKey: string) {
  const controllerGenericParams: Map<string, any> =
    Reflect.getMetadata(MetadataKey.GENERIC_PARAMETERS, controller) ?? Map()
  const actionGenericParams: Map<string, any> =
    Reflect.getMetadata(MetadataKey.GENERIC_PARAMETERS, controller, propKey) ?? Map()
  const genericParams = controllerGenericParams.merge(actionGenericParams)
  const [actionMetadata, actionOwner] = getActionMetadata(controller, propKey)
  const params: List<ParamInfo> = getParamInfos(controller, propKey, actionOwner, genericParams)
  const actionModule = new ActionModule(
    controller,
    propKey,
    actionMetadata.name,
    actionMetadata.method,
    actionMetadata.path,
    params
  )
  actionModule.responses = getResponseInfos(controller, propKey, actionOwner, genericParams)
  actionModule.summary = actionMetadata.summary
  const middleware: List<Middleware | KoaMiddleware> =
    Reflect.getMetadata(MetadataKey.MIDDLEWARE, controller, propKey) || List()
  actionModule.middleware = middleware
  const guards: Map<string, GuardGroup> = Reflect.getMetadata(MetadataKey.GUARDS, controller, propKey)
  if (guards) {
    actionModule.guards = guards
  }
  Reflect.defineMetadata(MetadataKey.ACTION_MODULE, actionModule, controller, propKey)
  return actionModule
}

export function createActions(controller: object) {
  let actions: List<string> = Reflect.getMetadata(MetadataKey.ACTIONS, controller) ?? List()
  const disabledActions: List<string> = Reflect.getOwnMetadata(MetadataKey.DISABLED_ACTIONS, controller) ?? List()
  actions = actions.filterNot((action) => disabledActions.contains(action))
  return actions.map((action) => {
    return createActionModule(controller, action)
  })
}
export function createControllerModule(ctrl: object) {
  const controllerModule = new ControllerModule(ctrl)
  const ctrlMetadata: CtrlMetadata | undefined = Reflect.getMetadata(MetadataKey.CONTROLLER, ctrl)
  if (!ctrlMetadata) {
    throw new TypeError('invalid controller instance')
  }
  controllerModule.name = ctrlMetadata.name
  controllerModule.plural = ctrlMetadata.plural
  controllerModule.prefix = ctrlMetadata.prefix
  controllerModule.path = ctrlMetadata.path
  controllerModule.version = ctrlMetadata.version
  controllerModule.desc = ctrlMetadata.desc
  const middleware = Reflect.getMetadata(MetadataKey.MIDDLEWARE, ctrl) || List()
  controllerModule.middleware = middleware
  const guards: Map<string, GuardGroup> = Reflect.getMetadata(MetadataKey.GUARDS, ctrl)
  if (guards) {
    controllerModule.guards = guards
  }
  controllerModule.actionModules = createActions(ctrl)
  Reflect.defineMetadata(MetadataKey.CONTROLLER_MODULE, controllerModule, ctrl)
  return controllerModule
}

export function createControllerRouter(controllerModule: ControllerModule) {
  const router = new Router({ prefix: controllerModule.prefix })
  const middleware = controllerModule.middleware.map((m) => (m instanceof Middleware ? m.toRawMiddleware() : m))

  router.use(...(middleware as List<any>))
  const actionModules = controllerModule.actionModules.sort((a, b) => {
    return a.path < b.path ? 1 : -1
  })
  for (const actionModule of actionModules) {
    const version = actionModule.version || controllerModule.version || ''
    let path = Path.join('/', version, controllerModule.path, actionModule.path)
    // strip the ending '/'
    if (path.endsWith('/')) {
      path = path.substr(0, path.length - 1)
    }
    const actionMiddleware = actionModule.middleware.map((m) => (m instanceof Middleware ? m.toRawMiddleware() : m))
    ;(router as any)[actionModule.method.toLowerCase()](
      path,
      ...actionMiddleware,
      actionModule.actionExecutor.execute.bind(actionModule.actionExecutor)
    )
  }
  return router
}

export function loadControllersRouter(controllers: List<ControllerModule>) {
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
