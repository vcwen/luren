import { Next } from 'koa'
import { ExecutionContext } from '../lib/ExecutionContext'
import { IProcessor, Processor } from './Processor'

export interface IPostprocessor extends IProcessor {
  postprocess(res: any, execCtx: ExecutionContext): Promise<any>
}

export abstract class Postprocessor extends Processor implements IPostprocessor {
  public async process(execCtx: ExecutionContext, next: Next) {
    const res = await next()
    return this.postprocess(execCtx, res)
  }
  public abstract async postprocess(execCtx: ExecutionContext, retValue?: any): Promise<any>
}
