import { Map } from 'immutable'
import { IMiddleware, IRouterContext } from 'koa-router'
import 'reflect-metadata'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { Phase } from '../../src/constants/Middleware'
import { Controller } from '../../src/decorators/Controller'
import { PostController, PostRoute, PreController, PreRoute } from '../../src/decorators/Middleware'
import { Get } from '../../src/decorators/Route'
describe('Middleware decorator', () => {
  describe('PreController', () => {
    it('should set middleware before controller', () => {
      const middleware1 = (ctx: IRouterContext) => {
        ctx.body = 'ok'
      }
      @Controller()
      @PreController(middleware1)
      class TestController {}
      const middlewares: Map<Phase, IMiddleware[]> = Reflect.getMetadata(MetadataKey.MIDDLEWARES, TestController)
      expect(middlewares.get(Phase.PRE)).toHaveLength(1)
      expect(middlewares.get(Phase.PRE)).toContain(middleware1)
    })
    it('should set middlewares before controller in order', () => {
      const middleware1 = (ctx: IRouterContext) => {
        ctx.body = 'ok'
      }
      const middleware2 = (ctx: IRouterContext) => {
        ctx.body = 'override'
      }
      // tslint:disable-next-line:max-classes-per-file
      @Controller()
      @PreController(middleware1, middleware2)
      class TestController {}
      const middlewares: Map<Phase, IMiddleware[]> = Reflect.getMetadata(MetadataKey.MIDDLEWARES, TestController)
      // tslint:disable-next-line:no-magic-numbers
      expect(middlewares.get(Phase.PRE)).toHaveLength(2)
      expect(middlewares.get(Phase.PRE)).toEqual([middleware1, middleware2])
    })
  })

  describe('PreController', () => {
    it('should set middleware before controller', () => {
      const middleware1 = (ctx: IRouterContext) => {
        ctx.body = 'ok'
      }
      // tslint:disable-next-line:max-classes-per-file
      @Controller()
      @PostController(middleware1)
      class TestController {}
      const middlewares: Map<Phase, IMiddleware[]> = Reflect.getMetadata(MetadataKey.MIDDLEWARES, TestController)
      expect(middlewares.get(Phase.POST)).toHaveLength(1)
      expect(middlewares.get(Phase.POST)).toContain(middleware1)
    })
    it('should set middlewares before controller in order', () => {
      const middleware1 = (ctx: IRouterContext) => {
        ctx.body = 'ok'
      }
      const middleware2 = (ctx: IRouterContext) => {
        ctx.body = 'override'
      }
      // tslint:disable-next-line:max-classes-per-file
      @Controller()
      @PostController(middleware1, middleware2)
      class TestController {}
      const middlewares: Map<Phase, IMiddleware[]> = Reflect.getMetadata(MetadataKey.MIDDLEWARES, TestController)
      // tslint:disable-next-line:no-magic-numbers
      expect(middlewares.get(Phase.POST)).toHaveLength(2)
      expect(middlewares.get(Phase.POST)).toEqual([middleware1, middleware2])
    })
  })

  describe('PreRoute', () => {
    it('should set middleware before route', () => {
      const middleware1 = (ctx: IRouterContext) => {
        ctx.body = 'ok'
      }
      // tslint:disable-next-line:max-classes-per-file
      @Controller()
      class TestController {
        @PreRoute(middleware1)
        @Get()
        public test(ctx: IRouterContext) {
          ctx.body = 'ok'
        }
      }
      const ctrl = new TestController()
      const middlewares: Map<Phase, IMiddleware[]> = Reflect.getMetadata(MetadataKey.MIDDLEWARES, ctrl, 'test')
      expect(middlewares.get(Phase.PRE)).toHaveLength(1)
      expect(middlewares.get(Phase.PRE)).toContain(middleware1)
    })
    it('should set middlewares before route in order', () => {
      const middleware1 = (ctx: IRouterContext) => {
        ctx.body = 'ok'
      }
      const middleware2 = (ctx: IRouterContext) => {
        ctx.body = 'override'
      }
      // tslint:disable-next-line:max-classes-per-file
      @Controller()
      @PostController(middleware1, middleware2)
      class TestController {
        @PreRoute(middleware1, middleware2)
        @Get()
        public test(ctx: IRouterContext) {
          ctx.body = 'ok'
        }
      }
      const ctrl = new TestController()
      const middlewares: Map<Phase, IMiddleware[]> = Reflect.getMetadata(MetadataKey.MIDDLEWARES, ctrl, 'test')
      // tslint:disable-next-line:no-magic-numbers
      expect(middlewares.get(Phase.PRE)).toHaveLength(2)
      expect(middlewares.get(Phase.PRE)).toEqual([middleware1, middleware2])
    })
  })
  describe('PostRoute', () => {
    it('should set middleware after route', () => {
      const middleware1 = (ctx: IRouterContext) => {
        ctx.body = 'ok'
      }
      // tslint:disable-next-line:max-classes-per-file
      @Controller()
      class TestController {
        @PostRoute(middleware1)
        @Get()
        public test(ctx: IRouterContext) {
          ctx.body = 'ok'
        }
      }
      const ctrl = new TestController()
      const middlewares: Map<Phase, IMiddleware[]> = Reflect.getMetadata(MetadataKey.MIDDLEWARES, ctrl, 'test')
      expect(middlewares.get(Phase.POST)).toHaveLength(1)
      expect(middlewares.get(Phase.POST)).toContain(middleware1)
    })
    it('should set middlewares after route in order', () => {
      const middleware1 = (ctx: IRouterContext) => {
        ctx.body = 'ok'
      }
      const middleware2 = (ctx: IRouterContext) => {
        ctx.body = 'override'
      }
      // tslint:disable-next-line:max-classes-per-file
      @Controller()
      @PostController(middleware1, middleware2)
      class TestController {
        @PostRoute(middleware1, middleware2)
        @Get()
        public test(ctx: IRouterContext) {
          ctx.body = 'ok'
        }
      }
      const ctrl = new TestController()
      const middlewares: Map<Phase, IMiddleware[]> = Reflect.getMetadata(MetadataKey.MIDDLEWARES, ctrl, 'test')
      // tslint:disable-next-line:no-magic-numbers
      expect(middlewares.get(Phase.POST)).toHaveLength(2)
      expect(middlewares.get(Phase.POST)).toEqual([middleware1, middleware2])
    })
  })
})
