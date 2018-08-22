import 'reflect-metadata'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { Controller } from '../../src/decorators/Controller'
import { Result } from '../../src/decorators/Result'
describe('Result', () => {
  it('should return decorator function when options is set', () => {
    @Controller()
    class TestController {
      @Result({ type: 'string' })
      public doSomething() {
        return 'hello'
      }
    }
    const ctrl = new TestController()
    const controller = Reflect.getMetadata(MetadataKey.RESULT, ctrl, 'doSomething')
    expect(controller).toEqual({ name: '', type: 'string' })
  })
})
