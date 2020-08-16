/* tslint:disable: max-classes-per-file */
import {
  BasicController,
  IQueryExecutor,
  IFilter,
  IConditions,
  Luren,
  Controller,
  GenericParams,
  Get,
  Response,
  InPath
} from '../../src'
import _ from 'lodash'
import request from 'supertest'
jest.unmock('@koa/router')

class Foo {
  constructor(public id: number) {}
}

const fieldCompare = (value: any, criteria: any): boolean => {
  if (Array.isArray(criteria)) {
    return _.isEqual(value, criteria)
  } else if (criteria === null) {
    return _.isNil(value)
  } else if (typeof criteria === 'object') {
    const keys = Object.keys(criteria)
    return keys.every((key) => {
      switch (key) {
        case '$gt':
          return value > criteria[key]
        case '$gte':
          return value >= criteria[key]
        case '$lt':
          return value < criteria[key]
        case '$lte':
          return value <= criteria[key]
        case '$eq':
          return _.isEqual(value, criteria[key])
        case '$ne':
          return !_.isEqual(value, criteria[key])
        case '$in':
          return _.includes(criteria[key], value)
        case '$nin':
          return !_.includes(criteria[key], value)
        case '$isNull': {
          if (criteria[key]) {
            return _.isNil(value)
          } else {
            return !_.isNil(value)
          }
        }
        case '$not':
          return !fieldCompare(value, criteria[key])
        default: {
          return fieldCompare(value[key], criteria[key])
        }
      }
    })
  } else {
    return value === criteria
  }
}

const match = (conditions: IConditions, data: object) => {
  if (conditions.$and) {
    const res = conditions.$and.every((cond) => match(cond, data))
    if (!res) {
      return false
    }
  }
  if (conditions.$or) {
    const res = conditions.$or.some((cond) => match(cond, data))
    if (!res) {
      return false
    }
  }
  if (conditions.$nor) {
    const res = conditions.$nor.every((cond) => !match(cond, data))
    if (!res) {
      return false
    }
  }
  const keys = Object.keys(conditions).filter((key) => !['$and', '$or', '$nor'].includes(key))
  for (const key of keys) {
    const res = fieldCompare(data[key], conditions[key])
    if (!res) {
      return false
    }
  }
  return true
}

const filterData = <T extends object>(rawData: T[], filter: IFilter) => {
  const { conditions, fields, limit, offset, order } = filter
  let data = rawData
  if (conditions) {
    data = data.filter((item) => match(conditions, item))
  }
  if (order) {
    const keys = Object.keys(order)
    const seq = keys.map((key) => {
      if (order[key] === 1) {
        return 'asc'
      } else if (order[key] === -1) {
        return 'desc'
      } else {
        return order[key]
      }
    })
    data = _.orderBy(data, keys, seq)
  }
  if (offset) {
    data = _.slice(data, offset)
  }
  if (limit) {
    data = _.take(data, limit)
  }
  if (fields) {
    data = _.map(data, (item) => {
      const obj: any = {}
      for (const key of fields) {
        obj[key] = item[key]
      }
      return obj
    })
  }
  return data
}

class QueryExecutor implements IQueryExecutor<Foo> {
  public idIndex: number = 100
  public data: Foo[] = []
  public async findById(id: number) {
    return this.data.find((item) => item.id === id)
  }
  public async findOne(filter: IFilter) {
    const data = filterData(this.data, filter)
    return _.head(data)
  }
  public async findMany(filter: IFilter) {
    return filterData(this.data, filter)
  }
  public async create(instance: Partial<Foo>) {
    const data: any = { ...instance, id: this.idIndex++ }
    this.data.push(data)
    return data
  }
  public async replaceById(id: number, replacement: Partial<Foo>) {
    const toReplace = this.data.find((item) => item.id === id)
    if (!toReplace) {
      return
    }
    const foo = new Foo(id)
    const keys = Object.keys(replacement)
    for (const key of keys) {
      foo[key] = replacement[key]
    }
    this.data = this.data.map((item) => {
      if (item.id === id) {
        return foo
      } else {
        return item
      }
    })
    return foo
  }
  public async update(data: object, conditions: IConditions): Promise<number> {
    const itemsToUpdate = this.data.filter((item) => match(conditions, item))
    for (const item of itemsToUpdate) {
      Object.assign(item, data)
    }
    return itemsToUpdate.length
  }
  public async updateById(id: any, data: any): Promise<Foo | undefined> {
    const val = this.data.find((item) => item.id === id)
    if (val) {
      const newVal = Object.assign(val, data)
      return newVal
    }
  }
  public async delete(conditions: IConditions): Promise<number> {
    const originLength = this.data.length
    this.data = this.data.filter((item) => !match(conditions, item))
    return originLength - this.data.length
  }
  public async deleteById(id: any): Promise<number> {
    let found = false
    this.data = this.data.filter((item) => {
      if (item.id === id) {
        found = true
        return false
      } else {
        return true
      }
    })
    return found ? 1 : 0
  }
}

@Controller({ path: 'foo' })
@GenericParams({
  ID: 'number',
  MODEL: { id: 'number', name: 'string', city: 'string?' },
  CREATE_MODEL: { name: 'string', city: 'string?' },
  REPLACE_MODEL: { name: 'string', city: 'string?' },
  ATTRIBUTES: { name: 'string?', city: 'string?' }
})
class SimpleController extends BasicController<Foo> {
  private _queryExecutor: QueryExecutor = new QueryExecutor()
  constructor(data: any[], idIndex: number = 1) {
    super()
    this._queryExecutor.data = data
    this._queryExecutor.idIndex = idIndex
  }
  public async getQueryExecutor() {
    return this._queryExecutor
  }
}

@Controller({ path: 'bar' })
@GenericParams({
  ID: 'number',
  MODEL: { id: 'number', name: 'string', city: 'string?' },
  CREATE_TYPE: { name: 'string', city: 'string?' },
  REPLACE_TYPE: { name: 'string', city: 'string?' },
  ATTRIBUTES: { name: 'string?', city: 'string?' }
})
class BarController extends BasicController<any> {
  private _queryExecutor: QueryExecutor = new QueryExecutor()
  constructor(data: any[], idIndex: number = 1) {
    super()
    this._queryExecutor.data = data
    this._queryExecutor.idIndex = idIndex
  }
  public async getQueryExecutor() {
    return this._queryExecutor
  }
  @Get({ path: ':id' })
  @Response({ type: { status: 'string' } })
  public async findById(
    @InPath('id', 'string')
    id: string
  ): Promise<{ status: string }> {
    const queryExecutor = await this.getQueryExecutor()
    const res = await queryExecutor.findById(Number.parseInt(id, 10))
    if (res) {
      return { status: 'ok' }
    } else {
      return { status: 'not_found' }
    }
  }
}

describe('BasicController', () => {
  describe('findById', () => {
    it('should find data by Id', async () => {
      const app = new Luren()
      const ctrl = new SimpleController([{ id: 1, name: 'bar' }])
      app.register(ctrl)
      const res = await request(app.callback()).get('/foo/1').expect(200)
      expect(res.body).toEqual({ id: 1, name: 'bar' })
    })
    it("should return 404 if data with this ID doesn't exists", async () => {
      const app = new Luren()
      const ctrl = new BarController([{ id: 1, name: 'bar' }])
      app.register(ctrl)
      const res = await request(app.callback()).get('/bar/1').expect(200)
      expect(res.body).toEqual({ status: 'ok' })
    })
    it('should be able to override by subclass', async () => {
      const app = new Luren()
      const ctrl = new SimpleController([{ id: 1, name: 'bar' }])
      app.register(ctrl)
      await request(app.callback()).get('/foo/101').expect(404)
    })
  })
  describe('findOne', () => {
    it('should find one record', async () => {
      const app = new Luren()
      const ctrl = new SimpleController([{ id: 1, name: 'bar' }])
      app.register(ctrl)
      const res = await request(app.callback()).get('/foo/findOne?offset=0&fields=["name"]&conditions={"name": "bar"}')
      expect(res.body).toEqual({ name: 'bar' })
    })
    it("should return 404 if data with this ID doesn't exists", async () => {
      const app = new Luren()
      const ctrl = new SimpleController([{ id: 1, name: 'bar' }])
      app.register(ctrl)
      await request(app.callback()).get('/foo/findOne?offset=1&fields=["name"]&conditions={"name": "bar"}').expect(404)
      await request(app.callback()).get('/foo/findOne?fields=["name"]&conditions={"name": "foo"}').expect(404)
      // expect(res.body).toEqual({ name: 'bar' })
    })
  })
  describe('findMany', () => {
    it('should find  matched records', async () => {
      const app = new Luren()
      const ctrl = new SimpleController([
        { id: 1, name: 'bar', city: 'hz' },
        { id: 2, name: 'foo', city: 'sh' },
        { id: 3, name: 'gee', city: 'hz' }
      ])
      app.register(ctrl)
      const res1 = await request(app.callback()).get('/foo?offset=0&fields=["name"]&conditions={"name": "bar"}')
      expect(res1.body).toEqual([{ name: 'bar' }])
      const res2 = await request(app.callback()).get('/foo?offset=0&fields=["name"]&conditions={"city": "hz"}')
      expect(res2.body).toEqual([{ name: 'bar' }, { name: 'gee' }])
      const res3 = await request(app.callback()).get(
        '/foo?offset=0&limit=1&order={"id": "desc"}&fields=["name"]&conditions={"city": "hz"}'
      )
      expect(res3.body).toEqual([{ name: 'gee' }])
    })
    it('should empty array if no records matched', async () => {
      const app = new Luren()
      const ctrl = new SimpleController([
        { id: 1, name: 'bar' },
        { id: 2, name: 'foo' },
        { id: 3, name: 'gee' }
      ])
      app.register(ctrl)
      const res1 = await request(app.callback())
        .get('/foo?offset=1&fields=["name"]&conditions={"name": "bar"}')
        .expect(200)
      expect(res1.body).toEqual([])
      const res2 = await request(app.callback()).get('/foo?fields=["name"]&conditions={"name": "noo"}').expect(200)
      expect(res2.body).toEqual([])
    })
  })
  describe('create', () => {
    it('should create new record', async () => {
      const app = new Luren()
      const ctrl = new SimpleController(
        [
          { id: 1, name: 'bar', city: 'hz' },
          { id: 2, name: 'foo', city: 'sh' },
          { id: 3, name: 'gee', city: 'hz' }
        ],
        100
      )
      app.register(ctrl)
      const res1 = await request(app.callback())
        .post('/foo')
        .set('Accept', 'application/json')
        .send({ name: 'kaa', city: 'jx' })
      expect(res1.body).toEqual({ city: 'jx', id: 100, name: 'kaa' })
    })
    it('should return 400 bad request if data is not valid', async () => {
      const app = new Luren()
      const ctrl = new SimpleController(
        [
          { id: 1, name: 'bar' },
          { id: 2, name: 'foo' },
          { id: 3, name: 'gee' }
        ],
        100
      )
      app.register(ctrl)
      await request(app.callback()).post('/foo').set('Accept', 'application/json').send({ city: 'jx' }).expect(400)
    })
  })
  describe('replaceById', () => {
    it('should replace the record with specified ID', async () => {
      const app = new Luren()
      const ctrl = new SimpleController(
        [
          { id: 1, name: 'bar', city: 'hz' },
          { id: 2, name: 'foo', city: 'sh' },
          { id: 3, name: 'gee', city: 'hz' }
        ],
        100
      )
      app.register(ctrl)
      const res1 = await request(app.callback())
        .put('/foo/2')
        .set('Accept', 'application/json')
        .send({ name: 'kaa', city: 'jx' })
      expect(res1.body).toEqual({ city: 'jx', id: 2, name: 'kaa' })
    })
    it('should return 404 record not found', async () => {
      const app = new Luren()
      const ctrl = new SimpleController(
        [
          { id: 1, name: 'bar' },
          { id: 2, name: 'foo' },
          { id: 3, name: 'gee' }
        ],
        100
      )
      app.register(ctrl)
      await request(app.callback())
        .put('/foo/5')
        .set('Accept', 'application/json')
        .send({ name: 'noo', city: 'jx' })
        .expect(404)
    })
    it('should return 400 bad request if replace data is not valid', async () => {
      const app = new Luren()
      const ctrl = new SimpleController(
        [
          { id: 1, name: 'bar' },
          { id: 2, name: 'foo' },
          { id: 3, name: 'gee' }
        ],
        100
      )
      app.register(ctrl)
      await request(app.callback()).put('/foo/5').set('Accept', 'application/json').send({ city: 'jx' }).expect(400)
    })
  })
  describe('updateAttributesById', () => {
    it('should update the record with specified ID', async () => {
      const app = new Luren()
      const ctrl = new SimpleController(
        [
          { id: 1, name: 'bar', city: 'hz' },
          { id: 2, name: 'foo', city: 'sh' },
          { id: 3, name: 'gee', city: 'hz' }
        ],
        100
      )
      app.register(ctrl)
      const res1 = await request(app.callback()).patch('/foo/2').set('Accept', 'application/json').send({ name: 'kaa' })
      expect(res1.body).toEqual({ city: 'sh', id: 2, name: 'kaa' })
    })
    it('should return 404 record not found', async () => {
      const app = new Luren()
      const ctrl = new SimpleController(
        [
          { id: 1, name: 'bar' },
          { id: 2, name: 'foo' },
          { id: 3, name: 'gee' }
        ],
        100
      )
      app.register(ctrl)
      await request(app.callback())
        .patch('/foo/5')
        .set('Accept', 'application/json')
        .send({ name: 'noo', city: 'jx' })
        .expect(404)
    })
    it('should return 400 bad request if replace data is not valid', async () => {
      const app = new Luren()
      const ctrl = new SimpleController(
        [
          { id: 1, name: 'bar' },
          { id: 2, name: 'foo' },
          { id: 3, name: 'gee' }
        ],
        100
      )
      app.register(ctrl)
      await request(app.callback()).patch('/foo/2').set('Accept', 'application/json').send({ age: 'jx' }).expect(400)
    })
  })
  describe('updateAttributes', () => {
    it('should update matched records ', async () => {
      const app = new Luren()
      const ctrl = new SimpleController(
        [
          { id: 1, name: 'bar', city: 'hz' },
          { id: 2, name: 'foo', city: 'sh' },
          { id: 3, name: 'gee', city: 'hz' }
        ],
        100
      )
      app.register(ctrl)
      const res1 = await request(app.callback())
        .patch('/foo')
        .set('Accept', 'application/json')
        .send({ conditions: { city: 'hz' }, attributes: { city: 'jx' } })
      expect(res1.body).toEqual(2)
    })
    it('should return 0 if no records matched', async () => {
      const app = new Luren()
      const ctrl = new SimpleController(
        [
          { id: 1, name: 'bar' },
          { id: 2, name: 'foo' },
          { id: 3, name: 'gee' }
        ],
        100
      )
      app.register(ctrl)
      const res = await request(app.callback())
        .patch('/foo')
        .set('Accept', 'application/json')
        .send({ conditions: { foo: 'bar' }, attributes: { name: 'noo', city: 'jx' } })
      expect(res.body).toBe(0)
    })
    it('should return 400 bad request if attributes are not valid', async () => {
      const app = new Luren()
      const ctrl = new SimpleController(
        [
          { id: 1, name: 'bar' },
          { id: 2, name: 'foo' },
          { id: 3, name: 'gee' }
        ],
        100
      )
      app.register(ctrl)
      await request(app.callback())
        .patch('/foo')
        .set('Accept', 'application/json')
        .send({ conditions: { id: 1 }, attributes: { age: 'jx' } })
        .expect(400)
    })
  })
  describe('delete', () => {
    it('should remove matched records ', async () => {
      const app = new Luren()
      const ctrl = new SimpleController(
        [
          { id: 1, name: 'bar', city: 'hz' },
          { id: 2, name: 'foo', city: 'sh' },
          { id: 3, name: 'gee', city: 'hz' }
        ],
        100
      )
      app.register(ctrl)
      const res1 = await request(app.callback()).delete('/foo').set('Accept', 'application/json').send({ city: 'hz' })
      expect(res1.body).toEqual(2)
    })
    it('should return 0 if no records matched', async () => {
      const app = new Luren()
      const ctrl = new SimpleController(
        [
          { id: 1, name: 'bar' },
          { id: 2, name: 'foo' },
          { id: 3, name: 'gee' }
        ],
        100
      )
      app.register(ctrl)
      const res = await request(app.callback()).delete('/foo').set('Accept', 'application/json').send({ foo: 'bar' })
      expect(res.body).toBe(0)
    })
  })
})
