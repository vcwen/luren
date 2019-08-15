import { Middleware } from 'koa'
import { IMiddlewareAdaptable } from '../types'
import { adaptMiddleware } from './utils'

export interface IProcessor<T = any> extends IMiddlewareAdaptable<T> {
  name?: string
  description?: string
  process(...args: any[]): Promise<T>
  toMiddleware(): Middleware
}
export default abstract class Processor<T = any> implements IProcessor<T> {
  public name?: string
  public description?: string
  public abstract async process(...args: any[]): Promise<T>
  public toMiddleware(): Middleware {
    return adaptMiddleware(this)
  }
}
