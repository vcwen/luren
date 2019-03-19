import { Constructor } from '../types/Constructor'

export abstract class QueryExecutor<T> {
  protected _schema: any
  constructor(model: Constructor<T>) {
    this._schema = model
  }
}
