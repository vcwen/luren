import { LurenQueryExecutor } from '../../src/datasource'
import { Constructor } from '../../src/types/Constructor'

describe('LurenQueryExecutor', () => {
  it('should define base protocol', () => {
    class QueryExecutor<T> extends LurenQueryExecutor<any> {
      public getSchema() {
        return this._schema
      }
      protected loadSchema(model: Constructor<T>): any {
        return model
      }
    }
    // tslint:disable-next-line: max-classes-per-file
    class Test {}
    const exec = new QueryExecutor(Test)
    expect(exec.getSchema()).toBe(Test)
  })
})
