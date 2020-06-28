import { ParameterizedContext, Middleware as KoaMiddleware } from 'koa'
import { ExecutionLevel } from '../constants/ExecutionLevel'
import { INext } from '../types'
import { ModuleContext } from './ModuleContext'
import debug from 'debug'

export interface IMiddleware {
  run(ctx: ParameterizedContext<any, any>, next: INext): Promise<any>
  onMount(level: ExecutionLevel, moduleContext: ModuleContext): void
  toRawMiddleware(): (ctx: any, next: INext) => Promise<any>
}

export abstract class Middleware implements IMiddleware {
  public abstract async run(ctx: ParameterizedContext<any, any>, next: INext): Promise<any>
  public onMount(level: ExecutionLevel, _moduleContext: ModuleContext): void {
    debug(`${this.constructor.name} attached to level: ${level}`)
  }
  public toRawMiddleware(): KoaMiddleware {
    return async (ctx: ParameterizedContext<any, any>, next: INext) => {
      return this.run(ctx, next)
    }
  }
}
