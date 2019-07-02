import { Middleware as KoaMid } from 'koa'

// tslint:disable-next-line: no-empty-interface
export interface IKoaMiddleware extends KoaMid {}

export interface IMiddleware {
  process(...args: any[]): Promise<any>
}
export default abstract class Middleware implements IMiddleware {
  public abstract async process(...args: any[]): Promise<any>
}
