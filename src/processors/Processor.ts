import { ParameterizedContext } from 'koa'
import { ExecutionContext } from '../lib/ExecutionContext'
import { IMiddleware, Middleware } from '../lib/Middleware'
import { ModuleContext } from '../lib/ModuleContext'
import { INext } from '../types'

export interface IProcessor extends IMiddleware {
  process(execCtx: ExecutionContext, next: INext): Promise<any>
}

export abstract class Processor extends Middleware implements IProcessor {
  public moduleContext?: ModuleContext
  public constructor() {
    super()
  }
  public abstract async process(execCtx: ExecutionContext, next: INext): Promise<any>
  public async run(ctx: ParameterizedContext, next: INext): Promise<any> {
    const execCtx = new ExecutionContext(ctx, ctx.moduleContext!)
    return this.process(execCtx, next)
  }
}
