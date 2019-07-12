import { Constructor } from '../types/Constructor'
import { IQueryExecutor } from './LurenQueryExecutor'

export interface IDataSourceOptions {
  url?: string
  host?: string
  port?: number
  [prop: string]: any
}

export interface IDataSource {
  getQueryExecutor<T extends object>(model: Constructor<T>): Promise<IQueryExecutor>
  loadSchema<T extends object>(model: Constructor<T>): Promise<boolean>
}

export abstract class LurenDataSource implements IDataSource {
  protected _connectUrl: string
  constructor(options: IDataSourceOptions) {
    this._connectUrl = this.getConnectUrl(options)
  }
  public abstract getQueryExecutor<T extends object>(model: Constructor<T>): Promise<IQueryExecutor>
  public abstract loadSchema<T extends object>(model: Constructor<T>): Promise<boolean>
  protected abstract getConnectUrl(options: IDataSourceOptions): string
}
