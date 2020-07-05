import 'reflect-metadata'
import { MountType, UseGuard, PresetGuardType, DisableGuards } from '../../src'
import { MetadataKey } from '../../src'
import { Action, Post } from '../../src'
import { Controller, Luren } from '../../src'
// import request from 'supertest'
import { APITokenAuthenticator, HttpAuthenticator } from '../../src'
import request from 'supertest'
import { GuardGroup } from '../../src'
import { List } from 'immutable'
jest.unmock('@koa/router')

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
    const ctrlGuards = Reflect.getMetadata(MetadataKey.GUARDS, TestController.prototype) as Map<string, GuardGroup>
    expect(ctrlGuards.get(PresetGuardType.Authenticator)).toEqual({
      mountType: MountType.INTEGRATE,
      guards: List([apiTokenAuth])
    })
    const actionGuards = Reflect.getOwnMetadata(MetadataKey.GUARDS, TestController.prototype, 'foo') as Map<
      string,
      GuardGroup
    >
    expect(actionGuards.get(PresetGuardType.Authenticator)).toEqual({
      mountType: MountType.INTEGRATE,
      guards: List([httpAuth])
    })
  })
})
describe('DummyGuard', () => {
  it('set dummy guard on the controller', () => {
    // tslint:disable-next-line: max-classes-per-file
    @Controller()
    class TestController {
      @DisableGuards(PresetGuardType.Authenticator)
      @Action()
      public foo() {
        return 'ok'
      }
    }
    const guards: Map<string, GuardGroup> = Reflect.getMetadata(MetadataKey.GUARDS, TestController.prototype, 'foo')
    expect(guards.get(PresetGuardType.Authenticator)).toEqual({
      mountType: MountType.OVERRIDE,
      guards: List([expect.objectContaining({ type: PresetGuardType.Authenticator })])
    })
  })
})

describe('DisableGuards', () => {
  it('disable guards for the controller', () => {
    // tslint:disable-next-line: max-classes-per-file
    @Controller()
    class TestController {
      @DisableGuards(PresetGuardType.Authenticator)
      @Action()
      public foo() {
        return 'ok'
      }
    }
    const guards: Map<string, GuardGroup> = Reflect.getMetadata(MetadataKey.GUARDS, TestController.prototype, 'foo')
    expect(guards.get(PresetGuardType.Authenticator)).toEqual({
      mountType: MountType.OVERRIDE,
      guards: List([expect.objectContaining({ type: 'Authenticator' })])
    })
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
      @DisableGuards(PresetGuardType.Authenticator)
      @Action()
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
