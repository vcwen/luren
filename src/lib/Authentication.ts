import { HttpStatusCode } from '../constants'
import { IMiddlewareAdaptable } from '../types'
import { adaptMiddleware } from './utils'

export default abstract class Authentication implements IMiddlewareAdaptable<boolean> {
  public abstract async process(...args: any[]): Promise<boolean>
  public toMiddleware() {
    return adaptMiddleware(this, async (res, ctx, next) => {
      if (res) {
        await next()
      } else {
        ctx.status = HttpStatusCode.UNAUTHORIZED
        ctx.body = 'Unauthorized'
      }
    })
  }
}
