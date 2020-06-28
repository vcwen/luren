import { exceptionHandler } from '../../src/middleware/ExceptionHandler'
describe('ErrorProcessor', () => {
  it('should log the error when the route throw an unhandled error', (done) => {
    const ctx: any = {
      app: {
        emit(event, data) {
          expect(event).toBe('error')
          expect(data).toEqual(new Error('my error'))
          done()
        }
      },
      set() {}
    }
    exceptionHandler(ctx, async () => {
      throw new Error('my error')
    })
  })
  it('should emit the error when the route throw an unhandled error and emitter is present ', (done) => {
    const ctx: any = {
      app: {
        emit(event, error) {
          expect(event).toBe('error')
          expect(error).toEqual(new Error('my error'))
          done()
        }
      },
      query: { foo: 'bar' },
      set() {}
    }
    exceptionHandler(ctx, async () => {
      throw new Error('my error')
    })
  })
})
