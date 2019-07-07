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
    try {
      await next()
      if (ctx.status >= HttpStatusCode.INTERNAL_SERVER_ERROR) {
        // tslint:disable-next-line: no-console
        console.info(ctx.status, ctx.body)
      }
    } catch (err) {
      ctx.status = HttpStatusCode.INTERNAL_SERVER_ERROR
      ctx.body = 'Internal Server Error'
      // tslint:disable-next-line: no-console
      console.error(err)
      if (this._errorEmitter) {
        this._errorEmitter.emit('error', err, ctx)
      }
    }
  }
}
