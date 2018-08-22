import { Map } from 'immutable'
import 'reflect-metadata'
import { HttpMethod } from '../../src/constants/HttpMethod'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { Delete, Get, Patch, Post, Put, Route } from '../../src/decorators/Route'

describe('Route', () => {
  it('should invoke directly when param is constructor', () => {
    class TestController {
      @Route()
      public getName(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const route = Reflect.getMetadata(MetadataKey.ROUTE, ctrl, 'getName')
    expect(route).toEqual({ method: 'GET', name: 'getName', path: 'getName', private: false })
  })

  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Route({
        private: true,
        name: 'MyTest',
        path: '/testPath',
        method: HttpMethod.POST,
        desc: 'get the name of app'
      })
      public getName(): string {
        return 'vc'
      }
    }
    const routes: Map<string, any> = Reflect.getMetadata(MetadataKey.ROUTE, TestController)
    expect(routes.get('getName')).toEqual({
      private: true,
      name: 'MyTest',
      path: '/testPath',
      method: 'POST',
      desc: 'get the name of app'
    })
  })
})
describe('Get', () => {
  it('should invoke directly when param is constructor', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Get
      public getName(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const routes: Map<string, any> = Reflect.getMetadata(MetadataKey.ROUTE, TestController)
    expect(routes.get('getName')).toEqual({ method: 'GET', name: 'getName', path: 'getName', private: false })
  })
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Get({
        private: true,
        name: 'MyTest',
        path: '/testPath',
        desc: 'get the name of app'
      })
      public getName(): string {
        return 'vc'
      }
    }
    const routes: Map<string, any> = Reflect.getMetadata(MetadataKey.ROUTE, TestController)
    expect(routes.get('getName')).toEqual({
      private: true,
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
      @Post
      public getName(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const routes: Map<string, any> = Reflect.getMetadata(MetadataKey.ROUTE, TestController)
    expect(routes.get('getName')).toEqual({ method: 'POST', name: 'getName', path: 'getName', private: false })
  })
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Post({
        private: true,
        name: 'CreateTest',
        path: '/create',
        desc: 'create a mock of app'
      })
      public getName(): string {
        return 'vc'
      }
    }
    const routes: Map<string, any> = Reflect.getMetadata(MetadataKey.ROUTE, TestController)
    expect(routes.get('getName')).toEqual({
      private: true,
      name: 'CreateTest',
      path: '/create',
      method: 'POST',
      desc: 'create a mock of app'
    })
  })
})

describe('PUT', () => {
  it('should invoke directly when param is constructor', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Put
      public getName(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const routes: Map<string, any> = Reflect.getMetadata(MetadataKey.ROUTE, TestController)
    expect(routes.get('getName')).toEqual({ method: 'PUT', name: 'getName', path: 'getName', private: false })
  })
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Put({
        private: true,
        name: 'UpdateTest',
        path: '/test',
        desc: 'update'
      })
      public getName(): string {
        return 'vc'
      }
    }
    const routes: Map<string, any> = Reflect.getMetadata(MetadataKey.ROUTE, TestController)
    expect(routes.get('getName')).toEqual({
      private: true,
      name: 'UpdateTest',
      path: '/test',
      method: 'PUT',
      desc: 'update'
    })
  })
})

describe('PATCH', () => {
  it('should invoke directly when param is constructor', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Patch
      public getName(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const routes: Map<string, any> = Reflect.getMetadata(MetadataKey.ROUTE, TestController)
    expect(routes.get('getName')).toEqual({ method: 'PATCH', name: 'getName', path: 'getName', private: false })
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
    const routes: Map<string, any> = Reflect.getMetadata(MetadataKey.ROUTE, TestController)
    expect(routes.get('getName')).toEqual({
      name: 'UpdateTest',
      path: '/test',
      method: 'PATCH',
      desc: 'partial update test',
      private: false
    })
  })
})

describe('DELETE', () => {
  it('should invoke directly when param is constructor', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Delete
      public getName(): string {
        return 'vc'
      }
    }
    const ctrl = new TestController()
    const routes: Map<string, any> = Reflect.getMetadata(MetadataKey.ROUTE, TestController)
    expect(routes.get('getName')).toEqual({ method: 'DELETE', name: 'getName', path: 'getName', private: false })
  })
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      @Delete({
        private: true,
        name: 'DeleteTest',
        path: '/test'
      })
      public getName(): string {
        return 'vc'
      }
    }
    const routes: Map<string, any> = Reflect.getMetadata(MetadataKey.ROUTE, TestController)
    expect(routes.get('getName')).toEqual({
      private: true,
      name: 'DeleteTest',
      path: '/test',
      method: 'DELETE'
    })
  })
})
