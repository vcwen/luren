import { badRequest } from 'boom'
import 'reflect-metadata'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { Controller } from '../../src/decorators/Controller'
import { Param } from '../../src/decorators/Param'
import { Delete, Get, Post, Put } from '../../src/decorators/Route'
import { createAction, createController, createRoute, createRoutes } from '../../src/lib/helper'
import { OK, redirect } from '../../src/lib/HttpResponse'
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
    return redirect('http://test.com')
  }
  @Get()
  public async boomErrorResponse() {
    throw badRequest('bad query data')
  }
  @Get()
  public async errorResponse() {
    throw new Error('something wrong')
  }
}
const controller = new TestController()

describe('helper', () => {
  describe('createAction', () => {
    it('should create the action', async () => {
      const action = createAction(controller, 'sayHello')
      const ctx: any = {
        query: { to: 'vincent' },
        is() {
          return false
        }
      }
      await action(ctx)
      expect(ctx.body).toEqual('hello vincent')
    })
    it('action should inject param from query', async () => {
      const action = createAction(controller, 'queryParam')
      const ctx: any = {
        query: { name: 'vincent' },
        is() {
          return false
        }
      }
      await action(ctx)
      expect(ctx.body).toEqual('vincent')
    })
    it('action should inject param from path', async () => {
      const action = createAction(controller, 'pathParam')
      const ctx: any = {
        params: { name: 'vincent' },
        is() {
          return false
        }
      }
      await action(ctx)
      expect(ctx.body).toEqual('vincent')
    })
    it('action should inject param from body', async () => {
      const action = createAction(controller, 'bodyParam')
      const ctx: any = {
        request: { body: { name: 'vincent' } },
        is() {
          return false
        }
      }
      await action(ctx)
      expect(ctx.body).toEqual('vincent')
    })
    it('action should inject param from header', async () => {
      const action = createAction(controller, 'headerParam')
      const ctx: any = {
        header: { name: 'vincent' },
        is() {
          return false
        }
      }
      await action(ctx)
      expect(ctx.body).toEqual('vincent')
    })
    it('action should inject context param', async () => {
      const action = createAction(controller, 'contextParam')
      const ctx: any = {
        name: 'vincent',
        is() {
          return false
        }
      }
      await action(ctx)
      expect(ctx.body).toEqual('vincent')
    })
    it('action should inject undefined if param is not present', async () => {
      const action = createAction(controller, 'sayHello')
      const ctx: any = {
        query: {},
        request: { body: {} },
        params: {},
        header: {},
        is() {
          return false
        }
      }
      await action(ctx)
      expect(ctx.body).toEqual('hello undefined')
    })
    it('action should throw error if a required param is not present', async () => {
      const action = createAction(controller, 'requiredParam')
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
      await action(ctx)
    })
    it('action should inject number param', async () => {
      const action = createAction(controller, 'numberParam')
      const ctx: any = {
        query: { rank: '2' },
        request: { body: {} },
        params: {},
        header: {},
        is() {
          return false
        }
      }
      await action(ctx)
    })
    it('action should throw error when param has invalid data', async () => {
      const action = createAction(controller, 'numberParam')
      const ctx: any = {
        query: { rank: '2}' },
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
      await action(ctx)
    })
    it('action should valid param throw superstruct it type is object', async () => {
      const action = createAction(controller, 'superstructParam')
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
      await action(ctx)
    })
    it('action should throw error if param can not pass the superstruct validation', async () => {
      const action = createAction(controller, 'superstructParam')
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
        await action(ctx)
      } catch (ex) {
        expect(ex).toBeInstanceOf(TypeError)
      }
    })
    it('action should deal with HttpStatus response', async () => {
      const action = createAction(controller, 'httpStatusResponse')
      const ctx: any = {
        is() {
          return false
        }
      }
      await action(ctx)
      expect(ctx.status).toBe(200)
      expect(ctx.body).toEqual('hello')
    })
    it('action should deal with redirect response', async () => {
      const action = createAction(controller, 'redirectResponse')
      const ctx = {
        status: 0,
        redirect(url: string) {
          expect(url).toEqual('http://test.com')
        },
        is() {
          return false
        }
      } as any
      await action(ctx)
      // tslint:disable-next-line:no-magic-numbers
      expect(ctx.status).toBe(302)
    })
    it('action should deal with boom error', async () => {
      const action = createAction(controller, 'boomErrorResponse')
      const ctx = {
        throw(code: number, desc: string) {
          // tslint:disable-next-line:no-magic-numbers
          expect(code).toBe(400)
          expect(desc).toEqual('bad query data')
        },
        is() {
          return false
        }
      } as any
      await action(ctx)
    })
    it("action should re-throw the error if it's not a boom error", async () => {
      const action = createAction(controller, 'errorResponse')
      const ctx = {
        is() {
          return false
        }
      } as any
      action(ctx).catch((ex) => {
        expect(ex).toBeInstanceOf(Error)
      })
    })
  })
  describe('createRoute', () => {
    it('should create the specific route', async () => {
      const route: any = createRoute(
        controller,
        'sayHello',
        Reflect.getMetadata(MetadataKey.ROUTES, controller).get('sayHello')
      )
      expect(route.method).toEqual('put')
      expect(route.path).toEqual('/tests/hello')
    })
  })
  describe('createRoutes', () => {
    it('should create all routes of controller', () => {
      const routes = createRoutes(controller)
      // tslint:disable-next-line:no-magic-numbers
      expect(routes.toArray()).toHaveLength(16)
    })
  })

  describe('setupController', () => {
    it('should load the controller', () => {
      const router: any = createController(controller)
      expect(router.routes['get:/tests/getName'].method).toEqual('get')
      expect(router.routes['delete:/tests/deleteName'].method).toEqual('delete')
      expect(router.routes['post:/tests/doSomething'].method).toEqual('post')
      expect(router.routes['put:/tests/hello'].method).toEqual('put')
    })
  })
})
