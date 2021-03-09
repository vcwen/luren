import { Next } from 'koa'
import { ExecutionContext } from '../lib/ExecutionContext'
import { IProcessor, Processor } from './Processor'

export interface IPreprocessor extends IProcessor {
  preprocess(execCtx: ExecutionContext): Promise<any>
}

export abstract class Preprocessor extends Processor implements IPreprocessor {
  public async process(execCtx: ExecutionContext, next: Next) {
    await this.preprocess(execCtx)
    return next()
  }
  public abstract async preprocess(execCtx: ExecutionContext): Promise<any>
}
