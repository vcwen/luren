import { List } from 'immutable'
import 'reflect-metadata'
import {
  Middleware,
  Response,
  Param,
  ParamSource,
  HttpMethod,
  redirect,
  StreamResponse,
  ok,
  IncomingFile,
  Luren
} from '../../src'
import { MetadataKey } from '../../src'
import { Get, Action, Post } from '../../src'
import { Controller } from '../../src'
import { UseMiddleware } from '../../src'
import { Context } from 'koa'
import { Prop, Schema } from 'luren-schema'
import fs from 'fs'
import Path from 'path'
import request from 'supertest'
jest.unmock('@koa/router')

// tslint:disable-next-line: max-classes-per-file
@Schema()
class Person {
  @Prop({ required: true })
  public name!: string
  @Prop({ type: 'number', required: true })
  public age!: number
}

// tslint:disable-next-line:max-classes-per-file
@Controller({ prefix: '/api' })
export default class PersonController {
  @Action()
  @Response({ type: Person })
  public hello(@Param({ name: 'name', in: ParamSource.QUERY }) name: string) {
    return { name: name || 'vc', age: 15 }
  }
  @Action({ method: HttpMethod.POST, path: '/something' })
  @Response({ type: ['string'] })
  public doSomething(@Param({ name: 'name', in: ParamSource.BODY, required: true }) name: string) {
    return ['ok', name]
  }
  @Action({ path: '/redirect' })
  public redirect() {
    // tslint:disable-next-line: no-magic-numbers
    return redirect('http://localhost/redirect', 301)
  }
  @Action({ method: HttpMethod.PUT })
  @Response({ type: { criteria: 'object', skip: 'number?' } })
  public hog(
    @Param({
      name: 'filter',
      in: 'body',
      type: { criteria: 'object', skip: 'number?', limit: 'number?' },
      root: true
    })
    filter: object
  ) {
    // tslint:disable-next-line: no-magic-numbers
    return filter
  }
  @Action()
  @Response({ type: { criteria: 'object', skip: 'number?' } })
  public wrong() {
    // tslint:disable-next-line: no-magic-numbers
    return { name: 'vc' }
  }
  @Action({ method: HttpMethod.POST })
  @Response({ type: { status: 'string' } })
  public upload(@Param({ name: 'avatar', in: 'body', type: 'file' }) avatar: IncomingFile) {
    // tslint:disable-next-line: no-magic-numbers
    if (avatar.size === 61626) {
      return { status: 'success' }
    } else {
      throw new Error('invalid file')
    }
  }
  @Action()
  @Response({ type: 'stream' })
  public download() {
    const rs = fs.createReadStream(Path.resolve(__dirname, './files/avatar.jpg'))
    return new StreamResponse(rs, { filename: 'image.jpg', mime: 'image/jpg' })
  }
  @Get()
  public auth() {
    return ok()
  }
}

describe('UseMiddleware ', () => {
  describe('metadata', () => {
    it('should set middleware for controller', () => {
      const middleware1 = Middleware.fromRawMiddleware((ctx: Context) => {
        ctx.body = 'ok'
      })
      // tslint:disable-next-line: max-classes-per-file
      @Controller()
      @UseMiddleware(middleware1)
      class TestController {}
      const middleware: List<any> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, TestController.prototype)
      expect(middleware.size).toBe(1)
      expect(middleware.contains(middleware1)).toBeTruthy()
    })
    it('should set middleware before controller in order', () => {
      const middleware1 = Middleware.fromRawMiddleware((ctx) => {
        ctx.body = 'ok'
      })
      const middleware2 = Middleware.fromRawMiddleware((ctx) => {
        ctx.body = 'override'
      })
      // tslint:disable-next-line:max-classes-per-file
      @Controller()
      @UseMiddleware(middleware1, middleware2)
      class TestController {}
      const middleware: List<Middleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, TestController.prototype)
      // tslint:disable-next-line:no-magic-numbers
      expect(middleware.size).toBe(2)
      expect(middleware.toArray()).toEqual([middleware1, middleware2])
    })
    it('should set middleware for route', () => {
      const middleware1 = Middleware.fromRawMiddleware((ctx) => {
        ctx.body = 'ok'
      })
      // tslint:disable-next-line:max-classes-per-file
      @Controller()
      class TestController {
        @UseMiddleware(middleware1)
        @Get()
        public test(ctx: Context) {
          ctx.body = 'ok'
        }
      }
      const ctrl = new TestController()
      const middleware: List<Middleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, ctrl, 'test')
      expect(middleware.size).toBe(1)
      expect(middleware.toArray()).toContain(middleware1)
    })
    it('should set middleware for route in order', () => {
      const middleware1 = Middleware.fromRawMiddleware((ctx) => {
        ctx.body = 'ok'
      })
      const middleware2 = Middleware.fromRawMiddleware((ctx) => {
        ctx.body = 'override'
      })
      // tslint:disable-next-line:max-classes-per-file
      @Controller()
      class TestController {
        @UseMiddleware(middleware1, middleware2)
        @Get()
        public test(ctx: Context) {
          ctx.body = 'ok'
        }
      }
      const ctrl = new TestController()
      const middleware: List<Middleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, ctrl, 'test')
      // tslint:disable-next-line:no-magic-numbers
      expect(middleware.size).toBe(2)
      expect(middleware.toArray()).toEqual([middleware1, middleware2])
    })
  })
  describe('middleware', () => {
    it('should be mounted in controller', async () => {
      const middleware1 = Middleware.fromRawMiddleware(async (ctx, next) => {
        ctx.m1 = new Date()
        await new Promise((resolve) => {
          setTimeout(resolve, 1000)
        })
        return next()
      })
      const middleware2 = Middleware.fromRawMiddleware(async (ctx, next) => {
        ctx.m2 = new Date()
        return next()
      })
      // tslint:disable-next-line:max-classes-per-file
      @UseMiddleware(middleware1, middleware2)
      @Controller({ plural: 'tests' })
      class TestController {
        @Get()
        public async test(ctx: any) {
          ctx.body = ctx.m2 - ctx.m1
        }
        @Post()
        public async hello(ctx: any) {
          ctx.body = ctx.m2 - ctx.m1
        }
      }
      const ctrl = new TestController()
      const app = new Luren()
      app.register(ctrl)

      const res1 = await request(app.callback()).get('/tests/test').expect(200)
      expect(Number.parseInt(res1.body, 10) >= 1000).toBeTruthy()
      const res2 = await request(app.callback()).post('/tests/hello').expect(200)
      expect(Number.parseInt(res2.body, 10) >= 1000).toBeTruthy()
    })
    it('should be mounted in action', async () => {
      const middleware1 = Middleware.fromRawMiddleware(async (ctx: any, next) => {
        ctx.m1 = new Date()
        await new Promise((resolve) => {
          setTimeout(resolve, 1000)
        })
        return next()
      })
      const middleware2 = Middleware.fromRawMiddleware(async (ctx: any, next) => {
        ctx.m2 = new Date()
        return next()
      })
      // tslint:disable-next-line:max-classes-per-file
      @Controller({ plural: 'tests' })
      class TestController {
        @Get()
        public async test(ctx: any) {
          ctx.body = ctx.m2 ?? 0 - ctx.m1 ?? 0
        }
        @Post()
        @UseMiddleware(middleware1)
        @UseMiddleware(middleware2)
        public async hello(ctx: any) {
          ctx.body = ctx.m2 - ctx.m1
        }
      }
      const ctrl = new TestController()
      const app = new Luren()
      app.register(ctrl)
      const res1 = await request(app.callback()).get('/tests/test').expect(200)
      expect(Number.parseInt(res1.body, 10) >= 1000).toBeFalsy()
      const res2 = await request(app.callback()).post('/tests/hello').expect(200)

      expect(Number.parseInt(res2.body, 10) >= 1000).toBeTruthy()
    })
  })
})
