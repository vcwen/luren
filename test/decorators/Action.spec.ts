import { Set } from 'immutable'
import 'reflect-metadata'
import { HttpMethod } from '../../src/constants/HttpMethod'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { Action, ActionMetadata, Delete, Get, Patch, Post, Put } from '../../src/decorators/Action'

describe('Action', () => {
  it('should invoke directly when param is constructor', () => {
    class TestController {
      @Action()
      public getName(): string {
        return 'vc'
      }
      @Action()
      public getAddress(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const actionMetadata: ActionMetadata = Reflect.getMetadata(MetadataKey.ACTION, ctrl, 'getName')
    expect(actionMetadata).toEqual({
      method: 'GET',
      name: 'getName',
      path: 'getName',
      deprecated: false
    })
    const actions: Set<string> = Reflect.getMetadata(MetadataKey.ACTIONS, ctrl) || Set()
    expect(actions).toEqual(Set(['getName', 'getAddress']))
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
    const action: ActionMetadata = Reflect.getMetadata(MetadataKey.ACTION, TestController.prototype, 'getName')
    expect(action).toEqual({
      name: 'MyTest',
      path: 'testPath',
      method: 'POST',
      desc: 'get the name of app',
      deprecated: false
    })
    const actions: Set<string> = Reflect.getMetadata(MetadataKey.ACTIONS, TestController.prototype)
    expect(actions).toEqual(Set(['getName']))
  })
  // it('should have params if params is set', () => {
  //   // tslint:disable-next-line:max-classes-per-file
  //   class TestController {
  //     @Action({
  //       name: 'MyTest',
  //       path: '/testPath',
  //       method: HttpMethod.POST,
  //       desc: 'get the name of app'
  //     })
  //     public getName(@InQuery('name') name: string): string {
  //       return name
  //     }
  //   }
  //   const actions: Map<string, ActionMetadata> = Reflect.getMetadata(MetadataKey.ACTIONS, TestController.prototype)
  //   expect(actions.get('getName')).toEqual({
  //     name: 'MyTest',
  //     path: 'testPath',
  //     method: 'POST',
  //     desc: 'get the name of app',
  //     deprecated: false,
  //     params: List([new ParamMetadata('name', 'query', true)])
  //   })
  // })
})
describe('Get', () => {
  it('should invoke directly when param is constructor', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Get()
      public getName(): string {
        return 'vc'
      }
      @Action()
      public getAddress(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const action: ActionMetadata = Reflect.getMetadata(MetadataKey.ACTION, ctrl, 'getName')
    expect(action).toEqual({
      method: 'GET',
      name: 'getName',
      path: 'getName',
      deprecated: false
    })
    const actions: Set<string> = Reflect.getMetadata(MetadataKey.ACTIONS, ctrl)
    expect(actions).toEqual(Set(['getName', 'getAddress']))
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
    const action = Reflect.getMetadata(MetadataKey.ACTION, TestController.prototype, 'getName')
    expect(action).toEqual({
      deprecated: false,
      name: 'MyTest',
      path: 'testPath',
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
      @Action()
      public getAddress(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const action: ActionMetadata = Reflect.getMetadata(MetadataKey.ACTION, ctrl, 'getName')
    expect(action).toEqual({
      method: 'POST',
      name: 'getName',
      path: 'getName',
      deprecated: false
    })
    const actions: Set<string> = Reflect.getMetadata(MetadataKey.ACTIONS, ctrl) || Set()
    expect(actions).toEqual(Set(['getName', 'getAddress']))
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
    const action: ActionMetadata = Reflect.getMetadata(MetadataKey.ACTION, TestController.prototype, 'getName')
    expect(action).toEqual({
      name: 'CreateTest',
      path: 'create',
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
      @Action()
      public getAddress(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const action: ActionMetadata = Reflect.getMetadata(MetadataKey.ACTION, ctrl, 'getName')
    expect(action).toEqual({
      method: 'PUT',
      name: 'getName',
      path: 'getName',
      deprecated: false
    })
    const actions: Set<string> = Reflect.getMetadata(MetadataKey.ACTIONS, ctrl)
    expect(actions).toEqual(Set(['getName', 'getAddress']))
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
    const action: ActionMetadata = Reflect.getMetadata(MetadataKey.ACTION, TestController.prototype, 'getName')
    expect(action).toEqual({
      name: 'UpdateTest',
      path: 'test',
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
    const action: ActionMetadata = Reflect.getMetadata(MetadataKey.ACTION, ctrl, 'getName')
    expect(action).toEqual({
      method: 'PATCH',
      name: 'getName',
      path: 'getName',
      deprecated: false
    })
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
    const action: ActionMetadata = Reflect.getMetadata(MetadataKey.ACTION, TestController.prototype, 'getName')
    expect(action).toEqual({
      name: 'UpdateTest',
      path: 'test',
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
    const action: ActionMetadata = Reflect.getMetadata(MetadataKey.ACTION, ctrl, 'getName')
    expect(action).toEqual({
      method: 'DELETE',
      name: 'getName',
      path: 'getName',
      deprecated: false
    })
  })
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Delete({
        name: 'DeleteTest',
        path: 'test'
      })
      public getName(): string {
        return 'vc'
      }
    }
    const action: ActionMetadata = Reflect.getMetadata(MetadataKey.ACTION, TestController.prototype, 'getName')
    expect(action).toEqual({
      name: 'DeleteTest',
      path: 'test',
      method: 'DELETE',
      deprecated: false
    })
  })
})
