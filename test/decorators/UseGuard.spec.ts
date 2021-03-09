import 'reflect-metadata'
import { UseGuard, Guard } from '../../src'
import { MetadataKey } from '../../src'
import { Post } from '../../src'
import { Controller } from '../../src'
import { APITokenAuthenticator, HttpAuthenticator } from '../../src'
import { List } from 'immutable'
import { MiddlewarePack } from '../lib/MiddlewarePack'

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
    const ctrlGuards: List<MiddlewarePack> =
      Reflect.getMetadata(MetadataKey.MIDDLEWARE_PACKS, TestController.prototype) || List()
    const guardPack = ctrlGuards.find((item) => item.middleware instanceof Guard)
    expect(guardPack?.middleware).toEqual(apiTokenAuth)
    const actionGuards: List<MiddlewarePack> = Reflect.getOwnMetadata(
      MetadataKey.MIDDLEWARE_PACKS,
      TestController.prototype,
      'foo'
    )
    const actionGuard = actionGuards.find((item) => item.middleware instanceof Guard)
    expect(actionGuard?.middleware).toEqual(httpAuth)
  })
})
