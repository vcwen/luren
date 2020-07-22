import { IQueryExecutor, IFilter, IConditions } from './QueryExecutor'
import { Get, Post, Patch, Delete, Response, Param, InPath } from '../decorators'
import { TemplateParams } from '../decorators/TemplateParameter'
import { HttpStatusCode } from '../constants'

export abstract class BasicController<T> {
  protected abstract getQueryExecutor(): Promise<IQueryExecutor<T>>
  @Get()
  @(TemplateParams('MODEL')((model) => {
    Response({ type: model })
  }))
  public async findOne(filter: Omit<IFilter, 'limit'>): Promise<T | undefined> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.findOne(filter)
  }
  @Get({ path: '' })
  @(TemplateParams('MODEL')((model) => {
    Response({ type: [model] })
  }))
  public async findMany(filter: IFilter): Promise<T[]> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.findMany(filter)
  }
  @Get({ path: ':id' })
  @(TemplateParams('MODEL')((model) => {
    Response({ type: model })
  }))
  public async findById(id: any): Promise<T | undefined> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.findById(id)
  }
  @Post({ path: '' })
  @(TemplateParams('MODEL')((model) => {
    Response({ type: model })
  }))
  public async create(@Param({ root: true, type: 'any', in: 'body' }) data: T): Promise<T> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.create(data)
  }
  @Patch({ path: '' })
  @(TemplateParams('MODEL')((model) => {
    Response({ type: model })
  }))
  public async update(data: T, filter: IFilter): Promise<number> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.update(data, filter)
  }
  @Patch({ path: ':id' })
  @(TemplateParams('MODEL')((model: any) => {
    Response({ type: model })
  }))
  public async updateById(id: any, data: any): Promise<void> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.updateById(id, data)
  }
  @Delete({ path: '' })
  @Response({ type: 'number' })
  public async delete(conditions: IConditions): Promise<number> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.delete(conditions)
  }
  @Delete({ path: ':id' })
  @Response({ status: HttpStatusCode.NO_CONTENT })
  public async deleteById(@(TemplateParams('ID')((idType: any) => InPath('id', idType))) id: any): Promise<void> {
    const queryExecutor = await this.getQueryExecutor()
    return queryExecutor.deleteById(id)
  }
}
