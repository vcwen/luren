import { Constructor } from '../types/Constructor'
import { QueryExecutor } from './QueryExecutor'

export interface IDatasourceOptions {
  url?: string
  host?: string
  port?: number
  database?: string
}

// tslint:disable-next-line:max-classes-per-file
export abstract class Datasource {
  protected _connectUrl: string
  constructor(options: IDatasourceOptions) {
    this._connectUrl = options.url || ''
  }
  public abstract getQueryExecutor<T>(model: Constructor<T>): Promise<QueryExecutor<T>>
}
