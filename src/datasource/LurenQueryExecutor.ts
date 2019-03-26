import { Constructor } from '../types/Constructor'

export abstract class LurenQueryExecutor<T> {
  protected _schema: any
  constructor(model: Constructor<T>) {
    this._schema = this.getSchema(model)
  }
  protected abstract getSchema(model: Constructor<T>): any
}
