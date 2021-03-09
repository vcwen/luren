import safeStringify from 'fast-safe-stringify'
import _ from 'lodash'
import { JsTypes, ValidationError } from 'luren-schema'
import { HttpStatusCode } from '../constants'
import { ExecutionLevel } from '../constants/ExecutionLevel'
import { MetadataKey } from '../constants/MetadataKey'
import { ExecutionContext } from '../lib/ExecutionContext'
import { Postprocessor } from './Postprocessor'
import { shouldHaveResponseBody } from '../lib/utils'
import { ActionModule } from '../lib'

export class ResponseConverter extends Postprocessor {
  public type: string = 'RESPONSE_CONVERTER'
  public level: ExecutionLevel = ExecutionLevel.ACTION
  public async postprocess(execCtx: ExecutionContext, res: any) {
    // convert response only for successful
    if (execCtx.httpContext.status !== HttpStatusCode.OK || !execCtx.moduleContext) {
      return res
    }
    const ctx = execCtx.httpContext
    const ctrl = execCtx.moduleContext.controllerModule?.controller as object
    const actionKey = execCtx.moduleContext.actionModule?.name as string
    const actionModule: ActionModule = Reflect.getMetadata(MetadataKey.ACTION_MODULE, ctrl, actionKey)
    const statusCode = execCtx.httpContext.status
    if (shouldHaveResponseBody(statusCode)) {
      const resInfo = actionModule.responses.get(statusCode)
      if (resInfo) {
        if (_.isNil(ctx.body)) {
          if (resInfo.required) {
            throw new TypeError('body is required')
          }
        } else {
          try {
            ctx.body = JsTypes.serialize(ctx.body, resInfo.schema)
            return res
          } catch (err) {
            throw new ValidationError(
              `${execCtx.httpContext.method.toUpperCase()} ${execCtx.httpContext.path}
            unexpected response: ${err.message ? err.message : ''}
            expected:
            ${safeStringify(resInfo.schema)}
            actual:
            ${safeStringify(ctx.body)}`
            )
          }
        }
      }
    } else {
      ctx.body = ''
    }
  }
}
