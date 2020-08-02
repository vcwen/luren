import safeStringify from 'fast-safe-stringify'
import { Map } from 'immutable'
import _ from 'lodash'
import { JsTypes, ValidationError } from 'luren-schema'
import { HttpStatusCode } from '../constants'
import { ExecutionLevel } from '../constants/ExecutionLevel'
import { MetadataKey } from '../constants/MetadataKey'
import { ResponseMetadata } from '../decorators'
import { ExecutionContext } from '../lib/ExecutionContext'
import { Postprocessor } from './Postprocessor'
import { shouldHaveResponseBody } from '../lib/utils'

export class ResponseConverter extends Postprocessor {
  public level: ExecutionLevel = ExecutionLevel.ACTION
  public async postprocess(execCtx: ExecutionContext, res: any) {
    // convert response only for successful
    if (execCtx.httpContext.status !== HttpStatusCode.OK || !execCtx.moduleContext) {
      return res
    }
    const ctx = execCtx.httpContext
    const ctrl = execCtx.moduleContext.controllerModule?.controller as object
    const actionKey = execCtx.moduleContext.actionModule?.name as string
    const resultMetadataMap: Map<number, ResponseMetadata> =
      Reflect.getMetadata(MetadataKey.RESPONSE, ctrl, actionKey) || Map()
    const statusCode = execCtx.httpContext.status
    if (shouldHaveResponseBody(statusCode)) {
      const resMetadata = resultMetadataMap.get(statusCode)
      if (resMetadata) {
        try {
          ctx.body = JsTypes.serialize(ctx.body, resMetadata.schema)
          return res
        } catch (err) {
          throw new ValidationError(
            `${execCtx.httpContext.method.toUpperCase()} ${execCtx.httpContext.path}
          unexpected response: ${err.message ? err.message : ''}
          expected:
          ${safeStringify(resMetadata.schema)}
          actual:
          ${safeStringify(ctx.body)}`
          )
        }
      }
    } else {
      ctx.body = ''
    }
  }
}
