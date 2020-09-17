import { Context, Next } from 'koa'
import { ExecutionContext } from '../lib/ExecutionContext'
import { IMiddleware, Middleware } from '../lib/Middleware'

export interface IProcessor extends IMiddleware {
  process(execCtx: ExecutionContext, next: Next): Promise<any>
}

export abstract class Processor extends Middleware implements IProcessor {
  public constructor() {
    super()
  }
  public abstract async process(execCtx: ExecutionContext, next: Next): Promise<any>
  public async execute(ctx: Context, next: Next): Promise<any> {
    const execCtx = new ExecutionContext(ctx, ctx.moduleContext!)
    return this.process(execCtx, next)
  }
}
