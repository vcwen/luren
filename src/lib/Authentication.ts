import { Context, Middleware } from 'koa'
import uid from 'uid-safe'
import { AuthenticationType, HttpStatusCode } from '../constants'
import { getRequestParam } from './helper'
import Processor from './Processor'
import { adaptMiddleware } from './utils'

export default abstract class AuthenticationProcessor extends Processor<boolean> {
  public name: string
  public abstract type: string
  constructor(name: string) {
    super()
    this.name = name
  }
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
  public abstract equals(another: AuthenticationProcessor): boolean
}

// tslint:disable-next-line: max-classes-per-file
export class APITokenAuthentication extends AuthenticationProcessor {
  public type = AuthenticationType.API_TOKEN
  public key: string
  public source: string
  private validate: (key: string) => Promise<boolean>
  constructor(options: {
    name?: string
    key: string
    source: string
    validate: (key: string) => Promise<boolean>
    description?: string
  }) {
    // tslint:disable-next-line: no-magic-numbers
    super(options.name || 'API_TOKEN_' + uid.sync(5))
    this.key = options.key
    this.validate = options.validate
    this.source = options.source
    this.description = options.description
  }
  public async process(context: Context): Promise<boolean> {
    const token = getRequestParam(context.request, this.key, this.source)
    if (token) {
      return this.validate(token)
    } else {
      return false
    }
  }
  public equals(another: AuthenticationProcessor) {
    if (this === another) {
      return true
    }
    if (another instanceof APITokenAuthentication) {
      if (this.type !== another.type) {
        return false
      }
      if (this.name !== another.name) {
        return false
      }
      if (this.key !== another.key) {
        return false
      }
      if (this.source !== another.source) {
        return false
      }
      if (this.validate !== another.validate) {
        return false
      }
      return true
    } else {
      return false
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
export class NoneAuthentication extends AuthenticationProcessor {
  public type = AuthenticationType.NONE
  constructor() {
    super('')
  }
  public async process(): Promise<boolean> {
    return true
  }
  public equals(another: AuthenticationProcessor) {
    return another.type === AuthenticationType.NONE
  }
}
