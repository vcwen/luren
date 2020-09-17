import 'reflect-metadata'
import { UseGuard, FilterMiddleware, Guard, Middleware, Authenticator } from '../../src'
import { MetadataKey } from '../../src'
import { Action, Post } from '../../src'
import { Controller, Luren } from '../../src'
import { APITokenAuthenticator, HttpAuthenticator } from '../../src'
import request from 'supertest'
import { List } from 'immutable'
import { MiddlewareFilter } from '../lib/MiddlewareFilter'

describe('UseGuard', () => {
  it('authenticate the controller', () => {
    const apiTokenAuth = new APITokenAuthenticator(
      async (token) => {
        return token === 'test_token'
      },
      {
        name: 'api_key',
        key: 'authorization',
        source: 'header'
      }
    )
    const httpAuth = new HttpAuthenticator(async (token) => {
      return token === 'test_token'
    })
    // tslint:disable-next-line: max-classes-per-file
    @Controller()
    @UseGuard(apiTokenAuth)
    class TestController {
      @UseGuard(httpAuth)
      @Post()
      public foo() {
        return 'ok'
      }
    }
    const ctrlGuards: List<Middleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, TestController.prototype) || List()
    const guard = ctrlGuards.find((item) => item instanceof Guard)
    expect(guard).toEqual(apiTokenAuth)
    const actionGuards = Reflect.getOwnMetadata(MetadataKey.MIDDLEWARE, TestController.prototype, 'foo')
    const actionGuard = actionGuards.find((item) => item instanceof Guard)
    expect(actionGuard).toEqual(httpAuth)
  })
})

describe('DisableGuards', () => {
  it('disable guards for the controller', () => {
    const filter = (guard) => guard instanceof Authenticator
    // tslint:disable-next-line: max-classes-per-file
    @Controller()
    class TestController {
      @FilterMiddleware({ scope: Guard, exclude: { filter } })
      @Action()
      public foo() {
        return 'ok'
      }
    }
    const filters: List<MiddlewareFilter> = Reflect.getMetadata(
      MetadataKey.MIDDLEWARE_FILTER,
      TestController.prototype,
      'foo'
    )
    expect(filters.find((m) => m.scope === Guard && m.exclude?.filter === filter)).not.toBeUndefined()
  })
  it('should disable  authenticator if the controller has set it', async () => {
    const apiTokenAuth = new APITokenAuthenticator(
      async (token) => {
        return token === 'test_token'
      },
      {
        name: 'api_key',
        key: 'authorization',
        source: 'header'
      }
    )
    // tslint:disable-next-line: max-classes-per-file
    @UseGuard(apiTokenAuth)
    @Controller()
    class TestController {
      @Action()
      @FilterMiddleware({ scope: Guard, exclude: { type: Authenticator } })
      public foo() {
        return 'ok'
      }
      @Action()
      public bar() {
        return 'ok'
      }
    }
    const ctrl = new TestController()
    const app = new Luren()
    app.register(ctrl)
    const res = await request(app.callback()).get('/tests/foo').expect(200)
    expect(res.text).toEqual('ok')
    await request(app.callback()).get('/tests/bar').expect(401)
  })
})
