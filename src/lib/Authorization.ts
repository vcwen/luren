import { Context, Middleware } from 'koa'
import { HttpStatusCode } from '../constants'
import { IProcessorConditions } from '../types'
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
export class ComposedAuthorizationProcessor extends AuthorizationProcessor {
  private _conditions: IProcessorConditions
  constructor(name: string, conditions: IProcessorConditions) {
    super(name)
    this._conditions = conditions
  }
  public async process(ctx: Context): Promise<boolean> {
    // tslint:disable-next-line: no-empty
    const emptyFunc = async () => {}
    const getResult = async (conditions: IProcessorConditions): Promise<boolean> => {
      if (conditions.and) {
        for (const condition of conditions.and) {
          const res = await (condition instanceof Processor
            ? adaptMiddleware(condition)(ctx, emptyFunc)
            : getResult(condition))
          if (!res) {
            return false
          }
        }
        return true
      } else {
        for (const condition of conditions.or) {
          const res = await (condition instanceof Processor
            ? adaptMiddleware(condition)(ctx, emptyFunc)
            : getResult(condition))
          if (res) {
            return true
          }
        }
        return false
      }
    }
    return getResult(this._conditions)
  }
}
