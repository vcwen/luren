import { Constructor } from '../types/Constructor'
import { IQueryExecutor } from './LurenQueryExecutor'

export interface IDatasourceOptions {
  url?: string
  host?: string
  port?: number
  [prop: string]: any
}

export interface IDataSource {
  getQueryExecutor<T extends object>(model: Constructor<T>): Promise<IQueryExecutor>
  loadSchema<T extends object>(model: Constructor<T>): Promise<boolean>
}

export abstract class LurenDatasource implements IDataSource {
  protected _connectUrl: string
  constructor(options: IDatasourceOptions) {
    this._connectUrl = this.getConnectUrl(options)
  }
  public abstract getQueryExecutor<T extends object>(model: Constructor<T>): Promise<IQueryExecutor>
  public abstract loadSchema<T extends object>(model: Constructor<T>): Promise<boolean>
  protected abstract getConnectUrl(options: IDatasourceOptions): string
}
