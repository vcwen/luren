import 'reflect-metadata'
import { HttpStatusCode } from '../../src'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { ErrorResponse, Response } from '../../src/decorators/Response'
import { IncomingFile } from '../../src/lib/IncomingFile'
describe('Response', () => {
  it('should return decorator function when options is set', () => {
    class TestController {
      @Response({ type: 'string' })
      @ErrorResponse({ status: 404, type: { code: 'number', message: 'string?' }, desc: 'when the thing is not found' })
      public doSomething() {
        return 'hello'
      }
      @Response({ type: 'file', headers: { 'Cache-Control': 'max-age=10000' } })
      public file() {
        return new IncomingFile('name', 'path', 'type', 1)
      }
      @Response({ type: 'stream', mime: 'image/png' })
      public stream() {
        return new IncomingFile('name', 'path', 'type', 1)
      }
      @Response()
      @ErrorResponse({ status: 404, desc: 'when the thing is not found' })
      public foo() {
        return 'hello'
      }
      @Response({ schema: { type: 'number' }, example: 123 })
      @ErrorResponse({
        status: 403,
        schema: { type: 'object' },
        desc: 'when the thing is not found',
        example: { code: 111, reason: 'this is an error message' }
      })
      public bar() {
        return 1
      }
    }
    const ctrl = new TestController()
    const resMap1 = Reflect.getMetadata(MetadataKey.RESPONSE, ctrl, 'doSomething')
    expect(resMap1.get(HttpStatusCode.OK)).toEqual(
      expect.objectContaining({
        status: 200,
        schema: expect.objectContaining({ type: 'string' })
      })
    )
    expect(resMap1.get(HttpStatusCode.NOT_FOUND)).toEqual(
      expect.objectContaining({
        status: 404,
        schema: {
          type: 'object',
          properties: { code: { type: 'number' }, message: { type: 'string' } },
          required: ['code']
        },
        desc: 'when the thing is not found'
      })
    )
    const fooResMap = Reflect.getMetadata(MetadataKey.RESPONSE, ctrl, 'foo')
    expect(fooResMap.get(HttpStatusCode.OK)).toEqual(
      expect.objectContaining({
        status: 200,
        schema: expect.objectContaining({ type: 'string' })
      })
    )
    expect(fooResMap.get(HttpStatusCode.NOT_FOUND)).toEqual(
      expect.objectContaining({
        status: 404,
        schema: {
          type: 'string'
        },
        desc: 'when the thing is not found'
      })
    )
    const barResMap = Reflect.getMetadata(MetadataKey.RESPONSE, ctrl, 'bar')
    expect(barResMap.get(HttpStatusCode.OK)).toEqual(
      expect.objectContaining({
        status: 200,
        schema: expect.objectContaining({ type: 'number' }),
        example: 123
      })
    )
    expect(barResMap.get(HttpStatusCode.FORBIDDEN)).toEqual(
      expect.objectContaining({
        status: 403,
        schema: {
          type: 'object'
        },
        desc: 'when the thing is not found',
        example: { code: 111, reason: 'this is an error message' }
      })
    )
    const fileResMap = Reflect.getMetadata(MetadataKey.RESPONSE, ctrl, 'file')
    expect(fileResMap.get(HttpStatusCode.OK)).toEqual({
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'max-age=10000'
      },
      schema: expect.objectContaining({ type: 'file' })
    })
    const streamResMap = Reflect.getMetadata(MetadataKey.RESPONSE, ctrl, 'stream')
    expect(streamResMap.get(HttpStatusCode.OK)).toEqual({
      status: 200,
      headers: {
        'Content-Type': 'image/png'
      },
      schema: { type: 'stream' }
    })
  })
})
