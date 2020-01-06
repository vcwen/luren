import { isBoom } from 'boom'
import { EventEmitter } from 'events'
import { Context } from 'koa'
import { HttpStatusCode } from '../constants'
import { HttpError } from '../lib/HttpError'
import Processor from '../lib/Processor'
import { INext } from '../types'

export default class ErrorProcessor extends Processor {
  private _errorEmitter?: EventEmitter
  constructor(errorEmitter?: EventEmitter) {
    super()
    this._errorEmitter = errorEmitter
  }
  public async process(ctx: Context, next: INext) {
    let error: any
    try {
      await next()
      if (ctx.status >= HttpStatusCode.INTERNAL_SERVER_ERROR) {
        error = ctx.body
      }
    } catch (err) {
      if (HttpError.isHttpError(err)) {
        ctx.body = err.getBody()
        if (err.headers) {
          ctx.set(err.headers as any)
        }
        ctx.status = err.status
      } else if (isBoom(err)) {
        ctx.body = err.output.payload
        ctx.set(err.output.headers)
        ctx.status = err.output.statusCode
      } else {
        error = 'Internal Server Error'
        ctx.body = error
        ctx.status = HttpStatusCode.INTERNAL_SERVER_ERROR
        if (this._errorEmitter) {
          this._errorEmitter.emit('error', err, ctx)
        }
      }
    }
  }
}
