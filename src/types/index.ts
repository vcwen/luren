import { List } from 'immutable'
import { Context, Middleware } from 'koa'

export type IProcess = (...args: any[]) => Promise<any>
export type INext = () => Promise<any>
export type IAuthenticate = (...args: any[]) => Promise<boolean>
export type IAuthorize = (...args: any[]) => Promise<boolean>
export interface ISecuritySettings {
  authentication?: Middleware
  authorization?: List<Middleware>
}

export interface IMiddlewareAdaptable<T = any> {
  process(...args: any[]): Promise<T>
  toMiddleware(): Middleware
}
export type IValidationMiddleware = (context: Context, next: () => Promise<any>) => Promise<boolean> | boolean
export type IMiddlewareConditions = { [key in 'and' | 'or']: Array<IValidationMiddleware | IMiddlewareConditions> }
