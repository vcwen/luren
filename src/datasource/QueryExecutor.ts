import { Constructor } from '../types/Constructor'

export abstract class QueryExecutor<T> {
  protected _schema: any
  constructor(model: Constructor<T>) {
    this._schema = model
  }
  // public abstract findById(id: any): Promise<T | undefined>
  public abstract find(): Promise<T[]>
  // public abstract update(): Promise<any>
  // public abstract delete(): Promise<any>
}
