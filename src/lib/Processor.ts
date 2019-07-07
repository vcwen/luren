import { Middleware } from 'koa'
import { IMiddlewareAdaptable } from '../types'
import { adaptMiddleware } from './utils'

export default abstract class Processor implements IMiddlewareAdaptable {
  public abstract async process(...args: any[]): Promise<any>
  public toMiddleware(): Middleware {
    return adaptMiddleware(this)
  }
}
