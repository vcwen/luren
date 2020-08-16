import { IQueryExecutor, IFilter, IConditions } from './QueryExecutor'
import { Get, Post, Patch, Delete, Response, Param, InPath, Put, InBody } from '../decorators'
import { HttpStatusCode } from '../constants'
import _ from 'lodash'
import { HttpException } from './HttpException'
import { GenericParam } from './GenericType'

const FindOneFilterType = {
  offset: 'number?',
  order: 'object?',
  'fields?': ['string'],
  conditions: 'object?'
}
const FindManyFilterType = {
  offset: 'number?',
  limit: 'number?',
  order: 'object?',
  'fields?': ['string'],
  conditions: 'object?'
}

export abstract class BasicController<T, ID = any> {
  protected abstract getQueryExecutor(): Promise<IQueryExecutor<T>>
  @Get()
  @Response({ type: GenericParam('MODEL') })
  public async findOne(
    @Param({ in: 'query', root: true, type: FindOneFilterType }) filter: Omit<IFilter, 'limit'>
  ): Promise<T | undefined> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.findOne(filter)
  }
  @Get({ path: '' })
  @Response({ type: GenericParam(({ MODEL: model }) => [model]) })
  public async findMany(@Param({ in: 'query', root: true, type: FindManyFilterType }) filter: IFilter): Promise<T[]> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.findMany(filter)
  }
  @Get({ path: ':id' })
  @Response({ type: GenericParam('MODEL') })
  public async findById(@InPath('id', GenericParam('ID')) id: any): Promise<T | undefined> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.findById(id)
  }
  @Post({ path: '' })
  @Response({ type: GenericParam('MODEL') })
  public async create(
    @Param({
      root: true,
      type: GenericParam(({ MODEL: model, CREATE_MODEL: createModelType }) => createModelType ?? model),
      in: 'body'
    })
    data: Partial<T>
  ): Promise<T> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.create(data)
  }
  @Put({ path: ':id' })
  @Response({ type: GenericParam('MODEL') })
  public async replaceById(
    @InPath('id', GenericParam('ID')) id: ID,
    @Param({
      in: 'body',
      root: true,
      type: GenericParam(({ REPLACE_MODEL, MODEL }) => REPLACE_MODEL ?? MODEL)
    })
    data: Partial<T>
  ): Promise<T | undefined> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.replaceById(id, data)
  }
  @Patch({ path: '' })
  @Response({ type: 'number' })
  public async updateAttributes(
    @InBody('attributes', GenericParam('ATTRIBUTES'))
    data: Partial<T>,
    @InBody('conditions', 'object') conditions: IConditions
  ): Promise<number> {
    const queryExecutor = await this.getQueryExecutor()
    if (_.isEmpty(data)) {
      throw HttpException.badRequest(`Attributes can not be empty`)
    }
    return queryExecutor.update(data, conditions)
  }
  @Patch({ path: ':id' })
  @Response({ type: GenericParam('MODEL') })
  public async updateAttributesById(
    @InPath('id', GenericParam('ID')) id: ID,
    @Param({ in: 'body', root: true, type: GenericParam('ATTRIBUTES') })
    data: Partial<T>
  ): Promise<T | undefined> {
    const queryExecutor = await this.getQueryExecutor()
    if (_.isEmpty(data)) {
      throw HttpException.badRequest(`Attributes can not be empty`)
    }
    return queryExecutor.updateById(id, data)
  }
  @Delete({ path: '' })
  @Response({ type: 'number' })
  public async delete(
    @Param({ in: 'body', root: true, type: 'object' })
    conditions?: IConditions
  ): Promise<number> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.delete(conditions)
  }
  @Delete({ path: ':id' })
  @Response({ status: HttpStatusCode.NO_CONTENT })
  public async deleteById(@InPath('id', GenericParam('ID')) id: any): Promise<number> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.deleteById(id)
  }
}
