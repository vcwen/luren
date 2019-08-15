import { EventEmitter } from 'events'
import { HttpStatusCode } from '../../src/constants'
import ErrorProcessor from '../../src/middleware/ErrorProcessor'
describe('ErrorProcessor', () => {
  it('should log the error when error content is returned', async () => {
    const error = console.error
    console.error = (status: any, body: any) => {
      expect(status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
      expect(body).toEqual('an unexpected error')
    }
    const ep = new ErrorProcessor()
    const ctx: any = {}
    await ep.process(ctx, async () => {
      ctx.status = HttpStatusCode.INTERNAL_SERVER_ERROR
      ctx.body = 'an unexpected error'
    })
    console.error = error
  })
  it('should log the error when the route throw an unhandled error', async () => {
    const error = console.error
    console.error = (err: any) => {
      expect(err).toEqual(new Error('my error'))
    }
    const ep = new ErrorProcessor()
    const ctx: any = {}
    await ep.process(ctx, async () => {
      throw new Error('my error')
    })
    console.error = error
  })
  it('should emit the error when the route throw an unhandled error and emitter is present ', (done) => {
    const emitter = new EventEmitter()
    const ep = new ErrorProcessor(emitter)
    emitter.on('error', (err: any, context?: any) => {
      expect(err).toEqual(new Error('my error'))
      expect(context).toEqual({ status: 500, body: 'Internal Server Error', query: { foo: 'bar' } })
      done()
    })
    const ctx: any = { query: { foo: 'bar' } }
    ep.process(ctx, async () => {
      throw new Error('my error')
    })
  })
})
