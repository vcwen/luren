import { IQueryExecutor, IFilter, IConditions } from './QueryExecutor'
import { Get, Post, Patch, Delete, Response, Param, InPath, Put, InBody } from '../decorators'
import { TemplateParams } from '../decorators/TemplateParameter'
import { HttpStatusCode } from '../constants'
import _ from 'lodash'
import { HttpException } from './HttpException'

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
  @(TemplateParams('MODEL')((model) => Response({ type: model })))
  public async findOne(
    @Param({ in: 'query', root: true, type: FindOneFilterType }) filter: Omit<IFilter, 'limit'>
  ): Promise<T | undefined> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.findOne(filter)
  }
  @Get({ path: '' })
  @(TemplateParams('MODEL')((model) => Response({ type: [model] })))
  public async findMany(@Param({ in: 'query', root: true, type: FindManyFilterType }) filter: IFilter): Promise<T[]> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.findMany(filter)
  }
  @Get({ path: ':id' })
  @(TemplateParams('MODEL')((model) => Response({ type: model })))
  public async findById(
    @(TemplateParams('ID')((IdType) => {
      return InPath('id', IdType)
    }))
    id: any
  ): Promise<T | undefined> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.findById(id)
  }
  @Post({ path: '' })
  @(TemplateParams('MODEL')((model) => Response({ type: model })))
  public async create(
    @(TemplateParams(
      'MODEL',
      'CREATE_TYPE'
    )((model, createModelType) => Param({ root: true, type: createModelType ?? model, in: 'body' })))
    data: Partial<T>
  ): Promise<T> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.create(data)
  }
  @Put({ path: ':id' })
  @(TemplateParams('MODEL')((model: any) => Response({ type: model })))
  public async replaceById(
    @(TemplateParams('ID')((IdType = 'any') => InPath('id', IdType))) id: ID,
    @(TemplateParams(
      'REPLACE_TYPE',
      'MODEL'
    )((ReplaceType = 'object') => Param({ in: 'body', root: true, type: ReplaceType })))
    data: Partial<T>
  ): Promise<T | undefined> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.replaceById(id, data)
  }
  @Patch({ path: '' })
  @Response({ type: 'number' })
  public async updateAttributes(
    @(TemplateParams('ATTRIBUTES')((Attributes = 'object') => InBody('attributes', Attributes)))
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
  @(TemplateParams('MODEL')((model: any) => Response({ type: model })))
  public async updateAttributesById(
    @(TemplateParams('ID')((IdType = 'any') => InPath('id', IdType))) id: ID,
    @(TemplateParams('ATTRIBUTES')((Attributes = 'object') => Param({ in: 'body', root: true, type: Attributes })))
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
  public async deleteById(@(TemplateParams('ID')((idType: any) => InPath('id', idType))) id: any): Promise<number> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.deleteById(id)
  }
}
