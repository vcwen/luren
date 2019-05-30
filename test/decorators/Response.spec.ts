import 'reflect-metadata'
import { HttpStatusCode } from '../../src'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { ErrorResponse, Response } from '../../src/decorators/Response'
describe('Response', () => {
  it('should return decorator function when options is set', () => {
    class TestController {
      @Response({ type: 'string' })
      @ErrorResponse({ status: 404, type: { code: 'number', message: 'string?' }, desc: 'when the thing is not found' })
      public doSomething() {
        return 'hello'
      }
    }
    const ctrl = new TestController()
    const resMap = Reflect.getMetadata(MetadataKey.RESPONSE, ctrl, 'doSomething')
    expect(resMap.get(HttpStatusCode.OK)).toEqual(
      expect.objectContaining({
        status: 200,
        schema: expect.objectContaining({ type: 'string' }),
        strict: true
      })
    )
    expect(resMap.get(HttpStatusCode.NOT_FOUND)).toEqual(
      expect.objectContaining({
        status: 404,
        schema: {
          type: 'object',
          properties: { code: { type: 'number' }, message: { type: 'string' } },
          required: ['code']
        },
        desc: 'when the thing is not found',
        strict: true
      })
    )
  })
})
