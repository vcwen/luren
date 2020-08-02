export interface IConditions {
  $and: IConditions[]
  $or: IConditions[]
  $nor: IConditions[]
  [key: string]:
    | {
        $gt?: string | Date | number
        $gte?: string | Date | number
        $lt?: string | Date | number
        $lte?: string | Date | number
        $eq?: any
        $ne?: any
        $in?: any[]
        $nin?: any[]
        $not: IConditions
        $isNull: any
      }
    | any
}

export interface IFilter {
  limit?: number
  offset?: number
  order?: any
  fields?: string[]
  conditions?: IConditions
}

export interface IQueryExecutor<T, ID = any> {
  findOne(filter?: IFilter): Promise<T | undefined>
  findMany(filter?: IFilter): Promise<T[]>
  findById(id: any): Promise<T | undefined>
  create(data: Partial<T>): Promise<T>
  replaceById(id: ID, replacement: Partial<T>): Promise<T | undefined>
  update(data: Partial<T>, conditions: IConditions): Promise<number>
  updateById(id: ID, data: any): Promise<T | undefined>
  delete(conditions?: IConditions): Promise<number>
  deleteById(id: any): Promise<number>
}
