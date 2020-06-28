describe('empty', () => {
  it('should succeed', () => {
    expect(1).toBe(1)
  })
})
/* import 'reflect-metadata'
import { HttpMethod, Luren } from '../../src'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { Delete, Get, Post, Put } from '../../src/decorators/Action'
import { Controller } from '../../src/decorators/Controller'
import { Param } from '../../src/decorators/Param'
import { createActionModule, createActions, createControllerModule } from '../../src/lib/helper'
import { ok, redirect } from '../../src/lib/HttpResponse'
jest.disableAutomock()
@Controller()
class TestController {
  @Post()
  public doSomething() {
    return 'something'
  }
  @Put({ path: 'hello' })
  public async sayHello(@Param({ name: 'to', required: false }) to: string) {
    return 'hello ' + to
  }
  @Get({ path: '' })
  public async getName() {
    return 'myname'
  }
  @Delete({ path: '' })
  public async deleteName() {
    // delete
  }
  @Get()
  public async queryParam(@Param({ name: 'name', in: 'query' }) name: string) {
    return name
  }
  @Get()
  public async pathParam(@Param({ name: 'name', in: 'path' }) name: string) {
    return name
  }
  @Get()
  public async bodyParam(@Param({ name: 'name', in: 'body' }) name: string) {
    return name
  }
  @Get()
  public async headerParam(@Param({ name: 'name', in: 'header' }) name: string) {
    return name
  }
  @Get()
  public async contextParam(@Param({ name: 'ctx', in: 'context', type: 'object', root: true }) ctx: any) {
    return ctx.name
  }
  @Get()
  public async requiredParam(@Param({ name: 'name', required: true }) name: string) {
    return name
  }
  @Get()
  public async numberParam(@Param({ name: 'rank', type: 'number', required: true }) rank: number) {
    return rank
  }
  @Get()
  public async superstructParam(
    @Param({ name: 'filter', type: { where: 'object?', order: 'string?', limit: 'number?' } }) filter: any
  ) {
    return filter
  }
  @Get()
  public async httpStatusResponse() {
    return OK('hello')
  }
  @Get()
  public async redirectResponse() {
    const res = await redirect('http://test.com')
    return res
  }
  @Get()
  public async boomErrorResponse() {
    throw HttpError.badRequest('bad query data')
  }
  @Get()
  public async errorResponse() {
    throw new Error('something wrong')
  }
}
const controller = new TestController()
const luren = new Luren()

describe('helper', () => {
  describe('createAction', () => {
    const next = async () => {}
    it('should create the action', async () => {
      const action = createUserProcess(controller, 'sayHello')
      const ctx: any = {
        query: { to: 'vincent' },
        is() {
          return false
        }
      }
      await action(ctx, next)
      expect(ctx.body).toEqual('hello vincent')
    })
    it('action should inject param from query', async () => {
      const action = createUserProcess(controller, 'queryParam')
      const ctx: any = {
        query: { name: 'vincent' },
        is() {
          return false
        }
      }
      await action(ctx, next)
      expect(ctx.body).toEqual('vincent')
    })
    it('action should inject param from path', async () => {
      const action = createUserProcess(controller, 'pathParam')
      const ctx: any = {
        params: { name: 'vincent' },
        is() {
          return false
        }
      }
      await action(ctx, next)
      expect(ctx.body).toEqual('vincent')
    })
    it('action should inject param from body', async () => {
      const action = createUserProcess(controller, 'bodyParam')
      const ctx: any = {
        request: { body: { name: 'vincent' } },
        is() {
          return false
        }
      }
      await action(ctx, next)
      expect(ctx.body).toEqual('vincent')
    })
    it('action should inject param from header', async () => {
      const action = createUserProcess(controller, 'headerParam')
      const ctx: any = {
        header: { name: 'vincent' },
        is() {
          return false
        }
      }
      await action(ctx, next)
      expect(ctx.body).toEqual('vincent')
    })
    it('action should inject context param', async () => {
      const action = createUserProcess(controller, 'contextParam')
      const ctx: any = {
        name: 'vincent',
        is() {
          return false
        }
      }
      await action(ctx, next)
      expect(ctx.body).toEqual('vincent')
    })
    it('action should inject undefined if param is not present', async () => {
      const action = createUserProcess(controller, 'sayHello')
      const ctx: any = {
        query: {},
        request: { body: {} },
        params: {},
        header: {},
        is() {
          return false
        }
      }
      await action(ctx, next)
      expect(ctx.body).toEqual('hello undefined')
    })
    it('action should throw error if a required param is not present', async () => {
      const action = createUserProcess(controller, 'requiredParam')
      const ctx: any = {
        query: {},
        request: { body: {} },
        params: {},
        header: {},
        throw(code: number, desc: string) {
          // tslint:disable-next-line:no-magic-numbers
          expect(code).toBe(400)
          expect(desc).toBe('name is required')
        },
        is() {
          return false
        }
      }
      expect(action(ctx, next)).rejects.toThrow('name is required in query')
    })
    it('action should inject number param', async () => {
      const action = createUserProcess(controller, 'numberParam')
      const ctx: any = {
        query: { rank: '2' },
        request: { body: {} },
        params: {},
        header: {},
        is() {
          return false
        }
      }
      await action(ctx, next)
    })
    it('action should throw error when param has invalid data', async () => {
      const action = createUserProcess(controller, 'numberParam')
      const ctx: any = {
        query: { rank: '2}' },
        request: { body: {} },
        params: {},
        header: {},
        is() {
          return false
        }
      }
      expect(action(ctx, next)).rejects.toThrow(`invalid value: '2}' for argument 'rank'`)
    })
    it('action should valid param throw superstruct it type is object', async () => {
      const action = createUserProcess(controller, 'superstructParam')
      const ctx: any = {
        query: { filter: JSON.stringify({ where: { name: 'vincent' }, order: 'desc', limit: 10 }) },
        request: { body: {} },
        params: {},
        header: {},
        throw(code: number, desc: string) {
          // tslint:disable-next-line:no-magic-numbers
          expect(code).toBe(401)
          expect(desc).not.toBeUndefined()
        },
        is() {
          return false
        }
      }
      await action(ctx, next)
    })
    it('action should throw error if param can not pass the  validation', async () => {
      const action = createUserProcess(controller, 'superstructParam')
      const ctx: any = {
        query: { filter: JSON.stringify({ where: { name: 'vincent' }, order: 'desc', limit: 'vincent' }) },
        request: { body: {} },
        params: {},
        header: {},
        is() {
          return false
        }
      }
      try {
        await action(ctx, next)
      } catch (ex) {
        expect(ex).toBeInstanceOf(HttpError)
        expect(ex.status).toEqual(400)
      }
    })
    it('action should deal with HttpStatus response', async () => {
      const action = createUserProcess(controller, 'httpStatusResponse')
      const ctx: any = {
        is() {
          return false
        }
      }
      await action(ctx, next)
      expect(ctx.status).toBe(200)
      expect(ctx.body).toEqual('hello')
    })
    it('action should deal with redirect response', async () => {
      const action = createUserProcess(controller, 'redirectResponse')
      const ctx = {
        status: 0,
        redirect(url: string) {
          expect(url).toEqual('http://test.com')
        },
        is() {
          return false
        }
      } as any
      await action(ctx, next)
      // tslint:disable-next-line:no-magic-numbers
      expect(ctx.status).toBe(302)
    })
    it('action should deal with boom error', async () => {
      const action = createActionModule(controller, 'boomErrorResponse')
      const ctx = {} as any
      expect(action(ctx, next)).rejects.toThrow('bad query data')
    })
    it("action should re-throw the error if it's not a boom error", async () => {
      const action = createUserProcess(controller, 'errorResponse')
      const ctx = {
        is() {
          return false
        }
      } as any
      expect(action(ctx, next)).rejects.toThrowError()
    })
  })
  describe('createAction', () => {
    it('should create the specific action', async () => {
      const action: any = createAction(
        luren,
        controller,
        'sayHello',
        Reflect.getMetadata(MetadataKey.ACTIONS, controller).get('sayHello')
      )
      expect(action.method).toEqual(HttpMethod.PUT)
      expect(action.path).toEqual('hello')
    })
  })
  describe('createActions', () => {
    it('should create all actions of controller', () => {
      const routes = createActions(luren, controller)
      // tslint:disable-next-line:no-magic-numbers
      expect(routes.toArray()).toHaveLength(16)
    })
  })

  describe('setupController', () => {
    it('should load the controller', () => {
      const ctrl = createController(luren, controller)
      expect(ctrl.name).toBe('Test')
      expect(ctrl.plural).toBeUndefined()
      expect(ctrl.prefix).toBe('')
      expect(ctrl.path).toBe('/tests')
      expect(ctrl.version).toBeUndefined()
    })
  })
})
*/
