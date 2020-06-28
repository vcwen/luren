import { List } from 'immutable'
import { RouterContext } from '@koa/router'
import 'reflect-metadata'
import { MetadataKey } from '../../src/constants/MetadataKey'
import { ParamSource } from '../../src/constants/ParamSource'
import {
  Body,
  Context,
  InBody,
  InContext,
  InHeader,
  InPath,
  InQuery,
  InRequest,
  InSession,
  inSource,
  Next,
  Param,
  ParamMetadata,
  Query,
  Request,
  Required,
  Session
} from '../../src/decorators/Param'
describe('Param', () => {
  it('should return decorator function when schema options is set', () => {
    class TestController {
      public test(
        @Param({ name: 'name', in: 'path' }) name: string,
        @Param({ name: 'age', in: 'query', required: false }) age: number,
        @Param({ name: 'foo', in: 'body', schema: { type: 'number' }, example: 1123 }) foo: number,
        @Param({ name: 'bar', schema: { type: 'boolean' }, required: true }) bar: boolean
      ) {
        return name + age + foo + bar
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: 'name',
        source: 'path',
        schema: { type: 'string' },
        root: false
      }),
      expect.objectContaining({ name: 'age', required: false, source: 'query', schema: { type: 'string' } }),
      expect.objectContaining({
        name: 'foo',
        required: true,
        source: 'body',
        schema: { type: 'number' },
        example: 1123
      }),
      expect.objectContaining({ name: 'bar', required: true, source: 'query', schema: { type: 'boolean' } })
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
      expect.objectContaining({ name: 'name', required: true, source: 'query', schema: { type: 'string' } })
    ])
  })
})

describe('InQuery', () => {
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(
        @InQuery('name') name: string,
        @InQuery('age', 'number?') age: number,
        @InQuery('id', 'number') id: number
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
        root: false
      }),
      expect.objectContaining({
        name: 'age',
        required: false,
        source: 'query',
        schema: { type: 'number' }
      }),
      expect.objectContaining({
        name: 'id',
        required: true,
        source: 'query',
        schema: { type: 'number' }
      })
    ])
  })
})

describe('InHeader', () => {
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(
        @InHeader('name') name: string,
        @InHeader('age', 'number', false) age: number,
        @InHeader('id', 'number') id: number
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
        root: false
      }),
      expect.objectContaining({
        name: 'age',
        required: false,
        source: 'header',
        schema: { type: 'number' }
      }),
      expect.objectContaining({
        name: 'id',
        required: true,
        source: 'header',
        schema: { type: 'number' }
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
        root: false
      }),
      expect.objectContaining({
        name: 'age',
        required: true,
        source: 'path',
        schema: expect.objectContaining({ type: 'number' })
      }),
      expect.objectContaining({
        name: 'id',
        required: true,
        source: 'path',
        schema: expect.objectContaining({ type: 'number' })
      })
    ])
  })
})

describe('InBody', () => {
  it('should return metadata function when schema options is set', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(
        @InBody('name') name: string,
        @InBody('age', 'number?') age: number,
        @InBody('id', 'number') id: number
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
        root: false
      }),
      expect.objectContaining({
        name: 'age',
        required: false,
        source: 'body',
        schema: { type: 'number' }
      }),
      expect.objectContaining({
        name: 'id',
        required: true,
        source: 'body',
        schema: { type: 'number' }
      })
    ])
  })
})
describe('Context', () => {
  it('should return decorator function when schema options is set', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(@Context() ctx: RouterContext) {
        return ctx.url
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: '',
        required: true,
        source: 'context',
        root: true
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
        schema: { type: 'string' }
      }),
      expect.objectContaining({
        name: 'age',
        required: true,
        source: 'query',
        root: false,
        schema: { type: 'number' }
      })
    ])
  })
})

describe('InRequest', () => {
  it('should param in request metadata', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(@InRequest('name', 'number', false) name: number) {
        return name
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: 'name',
        required: false,
        source: 'request',
        root: false,
        schema: { type: 'number' }
      })
    ])
  })
})

describe('InSession', () => {
  it('should param in session metadata', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(@InSession('foo', 'number') foo: number) {
        return foo
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: 'foo',
        required: true,
        source: 'session',
        root: false,
        schema: { type: 'number' }
      })
    ])
  })
})
describe('InContext', () => {
  it('should param in session metadata', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(@InContext('name', false) name: string, @InContext('age', 'number') age: number) {
        return name + age
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: 'name',
        required: false,
        source: 'context',
        root: false,
        schema: { type: 'string' }
      }),
      expect.objectContaining({
        name: 'age',
        required: true,
        source: 'context',
        root: false,
        schema: { type: 'number' }
      })
    ])
  })
})
describe('Query', () => {
  it('should query as param metadata', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(@Query() query: any) {
        return query
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: '',
        required: true,
        source: 'query',
        root: true,
        schema: { type: 'object' }
      })
    ])
  })
})
describe('Request', () => {
  it('should request as param metadata', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(@Request() req: any) {
        return req
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: '',
        required: true,
        source: 'request',
        root: true,
        schema: { type: 'object' }
      })
    ])
  })
})
describe('Session', () => {
  it('should request as param metadata', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(@Session() session: any) {
        return session
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: '',
        required: true,
        source: 'session',
        root: true,
        schema: { type: 'object' }
      })
    ])
  })
})
describe('Body', () => {
  it('should request as param metadata', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(@Body() body: any) {
        return body
      }
      public foo(@Body('array') body: any[]) {
        return body
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: '',
        required: true,
        source: 'body',
        root: true,
        schema: { type: 'object' }
      })
    ])
    const fooParams: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'foo')
    expect(fooParams.toArray()).toEqual([
      expect.objectContaining({
        name: '',
        required: true,
        source: 'body',
        root: true,
        schema: { type: 'array' }
      })
    ])
  })
})
describe('Next', () => {
  it('should request as param metadata', () => {
    // tslint:disable-next-line: max-classes-per-file
    class TestController {
      public test(@Next() next: () => any) {
        return next()
      }
    }
    const ctrl = new TestController()
    const params: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, ctrl, 'test')
    expect(params.toArray()).toEqual([
      expect.objectContaining({
        name: '',
        required: true,
        source: 'next',
        root: false,
        schema: { type: 'function' }
      })
    ])
  })
})

describe('InSource', () => {
  it('should throw error when name is not provided', () => {
    expect(() => {
      inSource(ParamSource.NEXT)()
    }).toThrowError()
  })
})
