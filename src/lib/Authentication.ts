import { Context, Middleware } from 'koa'
import { AuthenticationType, HttpStatusCode } from '../constants'
import { getRequestParam } from './helper'
import Processor from './Processor'
import { adaptMiddleware } from './utils'

export default abstract class AuthenticationProcessor extends Processor {
  public abstract type: AuthenticationType
  public abstract async process(...args: any[]): Promise<boolean>
  public toMiddleware(): Middleware {
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

// tslint:disable-next-line: max-classes-per-file
export class APIKeyAuthentication extends AuthenticationProcessor {
  public type = AuthenticationType.API_KEY
  private key: string
  private source: string
  private validateKey: (key: string) => Promise<boolean>
  constructor(key: string, source: string, validateKey: (key: string) => Promise<boolean>) {
    super()
    this.key = key
    this.validateKey = validateKey
    this.source = source
  }
  public async process(context: Context): Promise<boolean> {
    const apiKey = getRequestParam(context.request, this.key, this.source)
    if (apiKey) {
      return this.validateKey(apiKey)
    } else {
      return false
    }
  }
}
