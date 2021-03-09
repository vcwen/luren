/* tslint:disable: max-classes-per-file */
import { ExecutionContext, HttpException } from '../lib'
import { Preprocessor } from './Preprocessor'

export abstract class Guard extends Preprocessor {
  public constructor() {
    super()
  }
  public async preprocess(execCtx: ExecutionContext) {
    const valid = await this.validate(execCtx)
    if (!valid) {
      // default 403 Forbidden
      throw HttpException.forbidden()
    }
  }
  public abstract async validate(execCtx: ExecutionContext): Promise<boolean>
}
