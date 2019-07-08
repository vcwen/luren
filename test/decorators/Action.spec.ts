import { Map } from 'immutable'
import 'reflect-metadata'
import { HttpMethod } from '../../src/constants/HttpMethod'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { Action, ActionMetadata, Delete, Get, Patch, Post, Put } from '../../src/decorators/Action'

describe('ACtion', () => {
  it('should invoke directly when param is constructor', () => {
    class TestController {
      @Action()
      public getName(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const actions: Map<string, ActionMetadata> = Reflect.getMetadata(MetadataKey.ACTIONS, ctrl)
    expect(actions.get('getName')).toEqual({ method: 'GET', name: 'getName', path: '/getName', deprecated: false })
  })

  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Action({
        name: 'MyTest',
        path: '/testPath',
        method: HttpMethod.POST,
        desc: 'get the name of app'
      })
      public getName(): string {
        return 'vc'
      }
    }
    const actions: Map<string, ActionMetadata> = Reflect.getMetadata(MetadataKey.ACTIONS, TestController.prototype)
    expect(actions.get('getName')).toEqual({
      name: 'MyTest',
      path: '/testPath',
      method: 'POST',
      desc: 'get the name of app',
      deprecated: false
    })
  })
})
describe('Get', () => {
  it('should invoke directly when param is constructor', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Get()
      public getName(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const actions: Map<string, ActionMetadata> = Reflect.getMetadata(MetadataKey.ACTIONS, ctrl)
    expect(actions.get('getName')).toEqual({ method: 'GET', name: 'getName', path: '/getName', deprecated: false })
  })
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Get({
        name: 'MyTest',
        path: '/testPath',
        desc: 'get the name of app'
      })
      public getName(): string {
        return 'vc'
      }
    }
    const actions: Map<string, any> = Reflect.getMetadata(MetadataKey.ACTIONS, TestController.prototype)
    expect(actions.get('getName')).toEqual({
      deprecated: false,
      name: 'MyTest',
      path: '/testPath',
      method: 'GET',
      desc: 'get the name of app'
    })
  })
})

describe('POST', () => {
  it('should invoke directly when param is constructor', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Post()
      public getName(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const actions: Map<string, any> = Reflect.getMetadata(MetadataKey.ACTIONS, ctrl)
    expect(actions.get('getName')).toEqual({ method: 'POST', name: 'getName', path: '/getName', deprecated: false })
  })
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Post({
        name: 'CreateTest',
        path: '/create',
        desc: 'create a mock of app'
      })
      public getName(): string {
        return 'vc'
      }
    }
    const actions: Map<string, any> = Reflect.getMetadata(MetadataKey.ACTIONS, TestController.prototype)
    expect(actions.get('getName')).toEqual({
      name: 'CreateTest',
      path: '/create',
      method: 'POST',
      desc: 'create a mock of app',
      deprecated: false
    })
  })
})

describe('PUT', () => {
  it('should invoke directly when param is constructor', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Put()
      public getName(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const actions: Map<string, any> = Reflect.getMetadata(MetadataKey.ACTIONS, ctrl)
    expect(actions.get('getName')).toEqual({ method: 'PUT', name: 'getName', path: '/getName', deprecated: false })
  })
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Put({
        name: 'UpdateTest',
        path: '/test',
        desc: 'update'
      })
      public getName(): string {
        return 'vc'
      }
    }
    const actions: Map<string, any> = Reflect.getMetadata(MetadataKey.ACTIONS, TestController.prototype)
    expect(actions.get('getName')).toEqual({
      name: 'UpdateTest',
      path: '/test',
      method: 'PUT',
      desc: 'update',
      deprecated: false
    })
  })
})

describe('PATCH', () => {
  it('should invoke directly when param is constructor', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Patch()
      public getName(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const actions: Map<string, any> = Reflect.getMetadata(MetadataKey.ACTIONS, ctrl)
    expect(actions.get('getName')).toEqual({ method: 'PATCH', name: 'getName', path: '/getName', deprecated: false })
  })
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Patch({
        name: 'UpdateTest',
        path: '/test',
        desc: 'partial update test'
      })
      public getName(): string {
        return 'vc'
      }
    }
    const actions: Map<string, any> = Reflect.getMetadata(MetadataKey.ACTIONS, TestController.prototype)
    expect(actions.get('getName')).toEqual({
      name: 'UpdateTest',
      path: '/test',
      method: 'PATCH',
      desc: 'partial update test',
      deprecated: false
    })
  })
})

describe('DELETE', () => {
  it('should invoke directly when param is constructor', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Delete()
      public getName(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const actions: Map<string, any> = Reflect.getMetadata(MetadataKey.ACTIONS, ctrl)
    expect(actions.get('getName')).toEqual({ method: 'DELETE', name: 'getName', path: '/getName', deprecated: false })
  })
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Delete({
        name: 'DeleteTest',
        path: '/test'
      })
      public getName(): string {
        return 'vc'
      }
    }
    const actions: Map<string, any> = Reflect.getMetadata(MetadataKey.ACTIONS, TestController.prototype)
    expect(actions.get('getName')).toEqual({
      name: 'DeleteTest',
      path: '/test',
      method: 'DELETE',
      deprecated: false
    })
  })
})
