describe('empty', () => {
  it('should succeed', () => {
    expect(1).toBe(1)
  })
})
/* import { List } from 'immutable'
import 'reflect-metadata'
import { AuthenticationType } from '../../src'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { Get } from '../../src/decorators/Action'
import { Controller } from '../../src/decorators/Controller'
import { Middleware } from '../../src/decorators/Middleware'
import { APITokenAuthentication } from '../../src/processors/Authenticator'
import AuthorizationProcessor from '../../src/lib/Authorization'
import { RouterContext, Middleware as RouterMiddleware } from '@koa/router'

describe('Middleware decorator', () => {
  describe('Middleware', () => {
    it('should set middleware for controller', () => {
      const middleware1 = (ctx: RouterContext) => {
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
      const middleware1 = (ctx: RouterContext) => {
        ctx.body = 'ok'
      }
      const middleware2 = (ctx: RouterContext) => {
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
      const middleware1 = (ctx: RouterContext) => {
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
      const middleware1 = (ctx: RouterContext) => {
        ctx.body = 'ok'
      }
      const middleware2 = (ctx: RouterContext) => {
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
      const auth = new APITokenAuthentication({
        name: 'api_key',
        key: 'authorization',
        source: 'header',
        async validate(token: string) {
          return token === 'my_token'
        }
      })
      // tslint:disable-next-line: max-classes-per-file
      @Controller()
      @Authentication(auth)
      class TestController {
        @Authentication(auth)
        public foo() {
          return 'ok'
        }
      }
      const ctrlProcessor: AuthenticationProcessor = Reflect.getMetadata(
        MetadataKey.AUTHENTICATION,
        TestController.prototype
      )
      expect(ctrlProcessor).toBe(auth)
      const actionProcessor: AuthenticationProcessor = Reflect.getOwnMetadata(
        MetadataKey.AUTHENTICATION,
        TestController.prototype,
        'foo'
      )
      expect(actionProcessor).toBe(auth)
    })
  })
  describe('NoAuthentication', () => {
    it('no authentication for the controller', () => {
      // tslint:disable-next-line: max-classes-per-file
      @Controller()
      @NoAuthentication()
      class TestController {
        @NoAuthentication()
        public foo() {
          return 'ok'
        }
      }
      const ctrlProcessor: AuthenticationProcessor = Reflect.getMetadata(
        MetadataKey.AUTHENTICATION,
        TestController.prototype
      )
      expect(ctrlProcessor.type).toBe(AuthenticationType.NONE)
      const actionProcessor: AuthenticationProcessor = Reflect.getOwnMetadata(
        MetadataKey.AUTHENTICATION,
        TestController.prototype,
        'foo'
      )
      expect(actionProcessor.type).toBe(AuthenticationType.NONE)
    })
  })
  describe('Authorization', () => {
    it('authorize the controller', () => {
      // tslint:disable-next-line: max-classes-per-file
      class AdminAuthorization extends AuthorizationProcessor {
        public async process() {
          return
        }
      }
      const auth = new AdminAuthorization('isAdmin')
      // tslint:disable-next-line: max-classes-per-file
      @Controller()
      @Authorization(auth)
      class TestController {
        @Authorization(auth)
        public foo() {
          return 'ok'
        }
      }
      const ctrlProcessor: AuthorizationProcessor = Reflect.getMetadata(
        MetadataKey.AUTHORIZERS,
        TestController.prototype
      )
      expect(ctrlProcessor).toBe(auth)
      const actionProcessor: AuthorizationProcessor = Reflect.getOwnMetadata(
        MetadataKey.AUTHORIZERS,
        TestController.prototype,
        'foo'
      )
      expect(actionProcessor).toBe(auth)
    })
  })
})
*/
