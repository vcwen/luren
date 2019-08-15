import { Context, Middleware } from 'koa'
import { HttpStatusCode } from '../constants'
import { INext } from '../types'
import Processor from './Processor'
import { adaptMiddleware } from './utils'

export default abstract class AuthorizationProcessor extends Processor<boolean> {
  public name: string
  constructor(name: string, descriptions?: string) {
    super()
    this.name = name
    this.description = descriptions
  }
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

// tslint:disable-next-line: max-classes-per-file
export class ComposedAuthorization extends AuthorizationProcessor {
  private _process: (...args: any[]) => Promise<boolean>
  constructor(name: string, process: (...args: any[]) => Promise<boolean>) {
    super(name)
    this._process = process
  }
  public async process(ctx: Context, next: INext): Promise<boolean> {
    return this._process(ctx, next)
  }
}
