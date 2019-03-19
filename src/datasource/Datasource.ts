import { Constructor } from '../types/Constructor'
import { QueryExecutor } from './QueryExecutor'

export interface IDatasourceOptions {
  url?: string
  host?: string
  port?: number
  [prop: string]: any
}

export abstract class Datasource {
  protected _connectUrl: string
  constructor(options: IDatasourceOptions) {
    this._connectUrl = this.getConnectUrl(options)
  }
  public abstract getQueryExecutor<T>(model: Constructor<T>): Promise<QueryExecutor<T>>
  public abstract loadSchema<T>(model: Constructor<T>): Promise<boolean>
  protected abstract getConnectUrl(options: IDatasourceOptions): string
}
