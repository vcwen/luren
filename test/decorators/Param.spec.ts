import { List } from 'immutable'
import 'reflect-metadata'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { Controller } from '../../src/decorators/Controller'
import { Param } from '../../src/decorators/Param'
describe('Param', () => {
  it('should return decorator function when schema options is set', () => {
    @Controller()
    class TestController {
      public test(
        @Param({ name: 'name', source: 'path' }) name: string,
        @Param({ name: 'age', source: 'query' }) age: number
      ) {
        // tslint:disable-next-line:no-console
        console.log('>>>>>' + name + age)
      }
    }
    const ctrl = new TestController()
    const params: List<any> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      { name: 'name', required: false, source: 'path', type: 'string' },
      { name: 'age', required: false, source: 'query', type: 'string' }
    ])
  })

  it('should invoke directly when no param is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    @Controller()
    class TestController {
      public test(@Param({ name: 'name' }) name: string) {
        // tslint:disable-next-line:no-console
        console.log('>>>' + name)
      }
    }
    const ctrl = new TestController()
    const params: List<any> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([{ name: 'name', required: false, source: 'any', type: 'string' }])
  })
})
