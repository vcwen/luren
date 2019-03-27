import { Constructor } from '../types/Constructor'

// tslint:disable-next-line:no-empty-interface
export interface IQueryExecutor {}

export abstract class LurenQueryExecutor<T> implements IQueryExecutor {
  protected _schema: any
  constructor(model: Constructor<T>) {
    this._schema = this.getSchema(model)
  }
  protected abstract getSchema(model: Constructor<T>): any
}
