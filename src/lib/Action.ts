import { List, Map } from 'immutable'
import { Context, Next } from 'koa'
import { HttpMethod, HttpStatusCode, MetadataKey, ParamSource } from '../constants'
import { HttpResponse } from './HttpResponse'
import { Middleware } from './Middleware'
import { ParamInfo } from './ParamInfo'
import { ResponseInfo } from './ResponseInfo'
import { ControllerModule } from '.'
import Path from 'path'
import { Key, pathToRegexp } from 'path-to-regexp'
import { ActionMetadata, ParamMetadata, ResponseMetadata } from '../decorators'
import { IJsSchema, JsTypes, utils } from 'luren-schema'
import _ from 'lodash'
import 'reflect-metadata'
import { HttpException } from './HttpException'
import { IncomingFile } from './IncomingFile'
import { GenericType } from './GenericType'
import { normalizeHeaderCase } from './utils'
import mime from 'mime-types'
import { MiddlewareFilter } from './MiddlewareFilter'

export class ActionExecutor {
  public controller: object
  public name: string
  public params: List<ParamInfo> = List()
  public constructor(controller: object, method: string, params: List<ParamInfo> = List()) {
    this.controller = controller
    this.name = method
    this.params = params
  }
  public async execute(ctx: Context, next: Next) {
    const ctrl: any = this.controller
    const expectedArgs = getParams(ctx, next, this.params)
    const args = expectedArgs.size > 0 ? expectedArgs.toArray() : [ctx, next]
    const response = await ctrl[this.name].apply(ctrl, args)
    if (response instanceof HttpResponse) {
      const headers = response.getRawHeader()
      if (headers) {
        ctx.set(headers)
      }
      switch (response.status) {
        case 0: // the response is ignored
          return
        case HttpStatusCode.MOVED_PERMANENTLY:
        case HttpStatusCode.FOUND:
          ctx.redirect(response.body)
          break
        default:
          ctx.body = response.body
      }
      // set status at last, since set body might change the status
      ctx.status = response.status
    } else {
      // set response only if return value is not undefined/void
      if (response !== undefined) {
        ctx.body = response
      }
    }
    return response
  }
}

const getParam = (source: any, metadata: ParamInfo) => {
  if (metadata.root) {
    return source
  } else {
    return _.get(source, metadata.name)
  }
}

export const getParams = (ctx: Context, next: Next, paramsMetadata: List<ParamInfo> = List()) => {
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
      if (_.isNil(value)) {
        if (metadata.required) {
          throw new Error(`${metadata.source} is required`)
        } else {
          return
        }
      } else {
        if (metadata.schema.type === 'object') {
          const properties = metadata.schema.properties
          if (properties) {
            const obj = {} as any
            const props = Object.keys(properties)

            for (const prop of props) {
              const propJsonType = JsTypes.toJsonSchema(properties[prop]).type
              if (propJsonType !== 'any' && propJsonType !== 'string' && typeof value[prop] === 'string') {
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
    }
    const schema = metadata.schema
    const jsonType = JsTypes.toJsonSchema(schema).type
    if (jsonType !== 'any' && jsonType !== 'string' && typeof value === 'string') {
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
        return [simpleSchema.getActualType(genericParams.toObject())]
      } else {
        return [simpleSchema]
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
          return [simpleSchema.getActualType(genericParams.toObject())]
        } else {
          return [simpleSchema]
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
// tslint:disable-next-line: max-classes-per-file
export class ActionModule {
  public controllerModule: ControllerModule
  public targetFunction: string
  public name: string
  public actionExecutor: ActionExecutor
  public params: List<ParamInfo> = List()
  public responses: Map<number, ResponseInfo> = Map()
  public path: string
  public pathRegExp: { regExp: RegExp; params: (string | number)[] }
  public method: HttpMethod
  public middleware: List<Middleware> = List()
  public deprecated: boolean = false
  public version?: string
  public desc?: string
  public summary?: string
  constructor(controllerModule: ControllerModule, targetFunction: string) {
    this.controllerModule = controllerModule
    this.targetFunction = targetFunction

    const controllerGenericParams: Map<string, any> =
      Reflect.getMetadata(MetadataKey.GENERIC_PARAMETERS, controllerModule.controller) ?? Map()
    const actionGenericParams: Map<string, any> =
      Reflect.getMetadata(MetadataKey.GENERIC_PARAMETERS, controllerModule.controller, targetFunction) ?? Map()
    const genericParams = controllerGenericParams.merge(actionGenericParams)
    const [actionMetadata, actionOwner] = getActionMetadata(controllerModule.controller, targetFunction)

    this.name = actionMetadata.name
    this.method = actionMetadata.method
    this.path = actionMetadata.path
    const keys: Key[] = []
    const pathRegExp = pathToRegexp(this.getFullPath(), keys)
    const pathParams = keys.map((key) => key.name)
    this.pathRegExp = { regExp: pathRegExp, params: pathParams }
    this.params = getParamInfos(controllerModule.controller, targetFunction, actionOwner, genericParams)
    this.actionExecutor = new ActionExecutor(this.controllerModule.controller, targetFunction, this.params)
    this.responses = getResponseInfos(controllerModule.controller, targetFunction, actionOwner, genericParams)
    this.summary = actionMetadata.summary
    const middleware: List<Middleware> =
      Reflect.getMetadata(MetadataKey.MIDDLEWARE, controllerModule.controller, targetFunction) || List()
    const middlewareFilters: List<MiddlewareFilter> =
      Reflect.getMetadata(MetadataKey.MIDDLEWARE_FILTER, controllerModule.controller, targetFunction) || List()
    const filteredMiddleware = middlewareFilters.reduce(
      (mw, filter) => filter.filter(mw),
      controllerModule.middleware.concat(middleware).toArray()
    )
    this.middleware = List(filteredMiddleware)
  }
  public getFullPath() {
    const version = this.version ?? this.controllerModule.version ?? ''
    return Path.join('/', this.controllerModule.prefix, version, this.controllerModule.path, this.path)
  }
}
