import { Middleware } from 'koa'
import { IMiddlewareAdaptable } from '../types'
import { adaptMiddleware } from './utils'

export default abstract class Processor<T = any> implements IMiddlewareAdaptable<T> {
  public name?: string
  public description?: string
  public abstract async process(...args: any[]): Promise<T>
  public toMiddleware(): Middleware {
    return adaptMiddleware(this)
  }
}
