import { Middleware } from 'koa'
import AuthenticationProcessor from '../lib/Authentication'
import Processor from '../lib/Processor'

export type IProcess = (...args: any[]) => Promise<any>
export type INext = () => Promise<any>
export type IAuthenticate = (...args: any[]) => Promise<boolean>
export type IAuthorize = (...args: any[]) => Promise<boolean>
export interface ISecuritySettings {
  authentication?: AuthenticationProcessor
  authorization?: Middleware
}

export interface IMiddlewareAdaptable<T = any> {
  process(...args: any[]): Promise<T>
  toMiddleware(): Middleware
}
export type IProcessorConditions = { [key in 'and' | 'or']: Array<Processor<boolean> | IProcessorConditions> }
