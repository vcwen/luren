import { bodyParser } from '../../src/middleware/BodyParser'

jest.mock('koa-bodyparser', () => {
  return () => {
    return (ctx: any) => {
      if (ctx.rawBody) {
        ctx.body = ctx.rawBody
      }
    }
  }
})
jest.mock('../../src/lib/utils', () => {
  return {
    parseFormData() {
      return Promise.resolve({ fields: { bar: 'foo' } })
    }
  }
})

describe('BodyParser', () => {
  it('should parse body to json by default', async () => {
    const ctx: any = { request: { body: { foo: 'bar' } } }
    await bodyParser(ctx, async () => {
      expect(ctx.request.body).toEqual({ foo: 'bar' })
    })
  })
  it('should parse form if content type is multipart', async () => {
    const ctx: any = {
      request: { foo: 'bar' },
      is(content: any) {
        return content === 'multipart/form-data'
      }
    }
    await bodyParser(ctx, async () => {
      expect(ctx.request.body).toEqual({ bar: 'foo' })
    })
  })
  it('should do nothing if body already exists in request', async () => {
    const ctx: any = {
      request: { raw: { foo: 'raw' } },
      is() {
        return false
      }
    }
    await bodyParser(ctx, async () => {
      expect(ctx.request.body).toEqual({ foo: 'raw' })
    })
  })
})
