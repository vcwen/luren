import { Middleware } from 'koa'
import { HttpStatusCode } from '../constants'
import { IMiddlewareAdaptable } from '../types'
import { adaptMiddleware } from './utils'

export default abstract class Authorization implements IMiddlewareAdaptable<boolean> {
  public abstract async process(...args: any[]): Promise<boolean>
  public toMiddleware(): Middleware {
    return adaptMiddleware(this, async (res, ctx, next) => {
      if (res) {
        await next()
      } else {
        ctx.status = HttpStatusCode.FORBIDDEN
        ctx.body = 'Operation not allowed'
      }
    })
  }
}
