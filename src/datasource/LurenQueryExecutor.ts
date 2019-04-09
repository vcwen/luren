import { Constructor } from '../types/Constructor'

// tslint:disable-next-line:no-empty-interface
export interface IQueryExecutor {}

export abstract class LurenQueryExecutor<T extends object> implements IQueryExecutor {
  protected _schema: any
  protected _modelConstructor: Constructor<T>
  constructor(model: Constructor<T>) {
    this._modelConstructor = model
    this._schema = this.loadSchema(model)
  }
  protected abstract loadSchema(model: Constructor<T>): any
}
