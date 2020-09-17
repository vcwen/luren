/* tslint:disable: max-classes-per-file */
import { Processor, ExecutionContext, HttpException } from '../lib'
import { v4 as uuid } from 'uuid'
import { Next } from 'koa'

export abstract class Guard extends Processor {
  public id: string
  private _except?: (execContext: ExecutionContext) => Promise<boolean>
  public constructor(except?: string | RegExp | ((execContext: ExecutionContext) => Promise<boolean>)) {
    super()
    this.id = uuid()
    if (except) {
      if (typeof except === 'function') {
        this._except = except
      } else {
        let pathRegex: RegExp
        if (typeof except === 'string') {
          pathRegex = new RegExp(except)
        } else if (except instanceof RegExp) {
          pathRegex = except
        } else {
          throw new TypeError(`Invalid exclude value:${except}`)
        }
        this._except = async (execContext: ExecutionContext) => {
          return pathRegex.test(execContext.httpContext.path)
        }
      }
    }
  }
  public async process(execCtx: ExecutionContext, next: Next) {
    if (this._except && (await this._except(execCtx))) {
      return next()
    } else {
      const valid = await this.validate(execCtx)
      if (valid) {
        return next()
      } else {
        // default 403 Forbidden
        throw HttpException.forbidden()
      }
    }
  }
  public abstract async validate(execCtx: ExecutionContext): Promise<boolean>
}
