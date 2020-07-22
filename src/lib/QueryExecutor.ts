export interface IConditions {
  $and: IConditions[]
  $or: IConditions[]
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
        $notNull: any
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

export interface IQueryExecutor<T> {
  findOne(filter: IFilter): Promise<T | undefined>
  findMany(filter: IFilter): Promise<T[]>
  findById(id: any): Promise<T | undefined>
  create(data: T): Promise<T>
  update(data: T, filter: IFilter): Promise<number>
  updateById(id: any, data: any): Promise<void>
  delete(conditions: IConditions): Promise<number>
  deleteById(id: any): Promise<void>
}
