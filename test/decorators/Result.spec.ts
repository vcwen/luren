import 'reflect-metadata'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { Controller } from '../../src/decorators/Controller'
import { Response } from '../../src/decorators/Response'
describe('Result', () => {
  it('should return decorator function when options is set', () => {
    @Controller()
    class TestController {
      @Response({ type: 'string' })
      public doSomething() {
        return 'hello'
      }
    }
    const ctrl = new TestController()
    const controller = Reflect.getMetadata(MetadataKey.RESPONSE, ctrl, 'doSomething')
    expect(controller).toEqual({ name: '', type: 'string' })
  })
})
