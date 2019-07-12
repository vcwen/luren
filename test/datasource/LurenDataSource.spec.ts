import { IDataSourceOptions, IQueryExecutor, LurenDataSource } from '../../src'
import { Constructor } from '../../src/types/Constructor'

describe('LurenDataSource', () => {
  it('should define base protocol', () => {
    class DataSource extends LurenDataSource {
      public async getQueryExecutor<T>(model: Constructor<T>): Promise<IQueryExecutor> {
        return model as any
      }
      public async loadSchema<T>(model: Constructor<T>): Promise<boolean> {
        return typeof model === 'object'
      }
      public getUrl() {
        return this._connectUrl
      }
      protected getConnectUrl(options: IDataSourceOptions): string {
        return options.url as string
      }
    }
    const ds = new DataSource({ url: 'test://connect_url' })
    expect(ds.getUrl()).toBe('test://connect_url')
  })
})
