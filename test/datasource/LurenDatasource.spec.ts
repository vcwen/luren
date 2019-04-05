import { IDatasourceOptions, IQueryExecutor, LurenDatasource } from '../../src'
import { Constructor } from '../../src/types/Constructor'

describe('LurenDatasource', () => {
  it('should define base protocol', () => {
    class Datasource extends LurenDatasource {
      public async getQueryExecutor<T>(model: Constructor<T>): Promise<IQueryExecutor> {
        return model as any
      }
      public async loadSchema<T>(model: Constructor<T>): Promise<boolean> {
        return typeof model === 'object'
      }
      public getUrl() {
        return this._connectUrl
      }
      protected getConnectUrl(options: IDatasourceOptions): string {
        return options.url as string
      }
    }
    const ds = new Datasource({ url: 'test://connect_url' })
    expect(ds.getUrl()).toBe('test://connect_url')
  })
})
