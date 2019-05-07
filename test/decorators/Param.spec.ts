import { List } from 'immutable'
import { IRouterContext } from 'koa-router'
import 'reflect-metadata'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { Context, InBody, InHeader, InPath, InQuery, Param, ParamMetadata, Required } from '../../src/decorators/Param'
describe('Param', () => {
  it('should return decorator function when schema options is set', () => {
    class TestController {
      public test(@Param({ name: 'name', in: 'path' }) name: string, @Param({ name: 'age', in: 'query' }) age: number) {
        return name + age
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: 'name',
        required: false,
        source: 'path',
        schema: { type: 'string' },
        root: false,
        strict: true
      }),
      expect.objectContaining({ name: 'age', required: false, source: 'query', schema: { type: 'string' } })
    ])
  })

  it('should invoke directly when no param is set', () => {
    // tslint:disable-next-line:max-classes-per-file
    class TestController {
      public test(@Param({ name: 'name' }) name: string) {
        return name
      }
    }
    const ctrl = new TestController()
    const params: List<any> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({ name: 'name', required: false, source: 'query', schema: { type: 'string' } })
    ])
  })
})

describe('InQuery', () => {
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(
        @InQuery('name', true) name: string,
        @InQuery('age', 'number') age: number,
        @InQuery('id', 'number', true) id: number
      ) {
        return id + name + age
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: 'name',
        required: true,
        source: 'query',
        schema: { type: 'string' },
        root: false,
        strict: true
      }),
      expect.objectContaining({
        name: 'age',
        required: false,
        source: 'query',
        schema: { type: 'number' },
        strict: true
      }),
      expect.objectContaining({
        name: 'id',
        required: true,
        source: 'query',
        schema: { type: 'number' },
        strict: true
      })
    ])
  })
})

describe('InHeader', () => {
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(
        @InHeader('name', true) name: string,
        @InHeader('age', 'number') age: number,
        @InHeader('id', 'number', true) id: number
      ) {
        return id + name + age
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: 'name',
        required: true,
        source: 'header',
        schema: { type: 'string' },
        root: false,
        strict: true
      }),
      expect.objectContaining({
        name: 'age',
        required: false,
        source: 'header',
        schema: { type: 'number' },
        strict: true
      }),
      expect.objectContaining({
        name: 'id',
        required: true,
        source: 'header',
        schema: { type: 'number' },
        strict: true
      })
    ])
  })
})
describe('InPath', () => {
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(
        @InPath('name') name: string,
        @InPath('age', 'number') age: number,
        @InPath('id', 'number') id: number
      ) {
        return id + name + age
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: 'name',
        required: true,
        source: 'path',
        schema: expect.objectContaining({ type: 'string' }),
        root: false,
        strict: true
      }),
      expect.objectContaining({
        name: 'age',
        required: true,
        source: 'path',
        schema: expect.objectContaining({ type: 'number' }),
        strict: true
      }),
      expect.objectContaining({
        name: 'id',
        required: true,
        source: 'path',
        schema: expect.objectContaining({ type: 'number' }),
        strict: true
      })
    ])
  })
})

describe('InBody', () => {
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(
        @InBody('name', true) name: string,
        @InBody('age', 'number') age: number,
        @InBody('id', 'number', true) id: number
      ) {
        return id + name + age
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: 'name',
        required: true,
        source: 'body',
        schema: { type: 'string' },
        root: false,
        strict: true
      }),
      expect.objectContaining({
        name: 'age',
        required: false,
        source: 'body',
        schema: { type: 'number' },
        strict: true
      }),
      expect.objectContaining({
        name: 'id',
        required: true,
        source: 'body',
        schema: { type: 'number' },
        strict: true
      })
    ])
  })
})
describe('Context', () => {
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(@Context() ctx: IRouterContext) {
        return ctx.url
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: '',
        required: false,
        source: 'context',
        root: true,
        strict: true
      })
    ])
  })
})
describe('Required', () => {
  it('should set param required', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(@Required('name') name: string, @Required({ name: 'age', type: 'number' }) age: number) {
        return name + age
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: 'name',
        required: true,
        source: 'query',
        root: false,
        schema: { type: 'string' },
        strict: true
      }),
      expect.objectContaining({
        name: 'age',
        required: true,
        source: 'query',
        root: false,
        schema: { type: 'number' },
        strict: true
      })
    ])
  })
})
