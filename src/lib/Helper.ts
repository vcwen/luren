import Ajv from 'ajv'
import Boom from 'boom'
import { List } from 'immutable'
import { IRouterContext } from 'koa-router'
import 'reflect-metadata'
import { HttpStatusCode } from '../constants/HttpStatusCode'
import { ParamMetadata } from '../decorators/Param'

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
      throw Boom.badRequest(paramMeta.name + ' is required' + (paramMeta.source ? ' in ' + paramMeta.source : ''))
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
