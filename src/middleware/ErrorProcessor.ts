import { isBoom } from 'boom'
import { EventEmitter } from 'events'
import { Context } from 'koa'
import { HttpStatusCode } from '../constants'
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
      if (isBoom(err)) {
        ctx.status = err.output.statusCode
        ctx.body = err.output.payload
      } else {
        error = 'Internal Server Error'
        ctx.status = HttpStatusCode.INTERNAL_SERVER_ERROR
        ctx.body = error

        if (this._errorEmitter) {
          this._errorEmitter.emit('error', err, ctx)
        }
      }
    }
  }
}
