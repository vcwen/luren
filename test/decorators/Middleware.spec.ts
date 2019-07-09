import { List } from 'immutable'
import { Context } from 'koa'
import { IMiddleware, IRouterContext } from 'koa-router'
import 'reflect-metadata'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { Get } from '../../src/decorators/Action'
import { Controller } from '../../src/decorators/Controller'
import { Authentication, Middleware } from '../../src/decorators/Middleware'
import AuthenticationProcessor, { APIKeyAuthentication } from '../../src/lib/Authentication'
describe('Middleware decorator', () => {
  describe('Middleware', () => {
    it('should set middleware for controller', () => {
      const middleware1 = (ctx: Context) => {
        ctx.body = 'ok'
      }
      @Controller()
      @Middleware(middleware1)
      class TestController {}
      const middleware: List<IMiddleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, TestController.prototype)
      expect(middleware.size).toBe(1)
      expect(middleware.contains(middleware1)).toBeTruthy()
    })
    it('should set middleware before controller in order', () => {
      const middleware1 = (ctx: Context) => {
        ctx.body = 'ok'
      }
      const middleware2 = (ctx: Context) => {
        ctx.body = 'override'
      }
      // tslint:disable-next-line:max-classes-per-file
      @Controller()
      @Middleware(middleware1, middleware2)
      class TestController {}
      const middleware: List<IMiddleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, TestController.prototype)
      // tslint:disable-next-line:no-magic-numbers
      expect(middleware.size).toBe(2)
      expect(middleware.toArray()).toEqual([middleware1, middleware2])
    })
    it('should set middleware for route', () => {
      const middleware1 = (ctx: Context) => {
        ctx.body = 'ok'
      }
      // tslint:disable-next-line:max-classes-per-file
      @Controller()
      class TestController {
        @Middleware(middleware1)
        @Get()
        public test(ctx: IRouterContext) {
          ctx.body = 'ok'
        }
      }
      const ctrl = new TestController()
      const middleware: List<IMiddleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, ctrl, 'test')
      expect(middleware.size).toBe(1)
      expect(middleware.toArray()).toContain(middleware1)
    })
    it('should set middleware for route in order', () => {
      const middleware1 = (ctx: Context) => {
        ctx.body = 'ok'
      }
      const middleware2 = (ctx: Context) => {
        ctx.body = 'override'
      }
      // tslint:disable-next-line:max-classes-per-file
      @Controller()
      class TestController {
        @Middleware(middleware1, middleware2)
        @Get()
        public test(ctx: IRouterContext) {
          ctx.body = 'ok'
        }
      }
      const ctrl = new TestController()
      const middleware: List<IMiddleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, ctrl, 'test')
      // tslint:disable-next-line:no-magic-numbers
      expect(middleware.size).toBe(2)
      expect(middleware.toArray()).toEqual([middleware1, middleware2])
    })
  })
  describe('Authentication', () => {
    it('authenticate the controller', () => {
      const auth = new APIKeyAuthentication({
        name: 'api_key',
        key: 'authorization',
        source: 'header',
        async validateKey(token: string) {
          return token === 'my_token'
        }
      })
      // tslint:disable-next-line: max-classes-per-file
      @Controller()
      @Authentication(auth)
      class TestController {}
      const processor: AuthenticationProcessor = Reflect.getMetadata(
        MetadataKey.AUTHENTICATION,
        TestController.prototype
      )
      expect(processor).toBe(auth)
    })
  })
})
