import { Constructor } from '../types/Constructor'

// tslint:disable-next-line:no-empty-interface
export interface IQueryExecutor {}

export abstract class LurenQueryExecutor<T> implements IQueryExecutor {
  protected _schema: any
  constructor(model: Constructor<T>) {
    this._schema = this.loadSchema(model)
  }
  protected abstract loadSchema(model: Constructor<T>): any
}
