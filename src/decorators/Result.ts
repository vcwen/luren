import { List, Map } from 'immutable'
import 'reflect-metadata'
import { HttpStatusCode } from '../constants'
import { MetadataKey } from '../constants/MetadataKey'
import { IJsonSchema, normalizeSimpleSchema } from '../lib/utils'
import { PropertyDecorator } from '../types/PropertyDecorator'
export interface IResultOptions {
  status?: number
  type?: any
  schema?: any
  desc?: string
  strict?: boolean
}

export class ResultMetadata {
  public status: number = HttpStatusCode.OK
  public schema: IJsonSchema
  public strict: boolean = false
  public desc?: string
  constructor(status: number, schema: IJsonSchema, strict: boolean = false, desc?: string) {
    this.status = status
    this.schema = schema
    this.strict = strict
    this.desc = desc
  }
}

export function Result(options: IResultOptions): PropertyDecorator {
  return (target: any, propertyKey: string) => {
    let resultMetadata: Map<number, ResultMetadata> =
      Reflect.getOwnMetadata(MetadataKey.RESULT, target, propertyKey) || Map()
    const status = options.status || HttpStatusCode.OK
    const schema = options.schema ? options.schema : normalizeSimpleSchema(options.type || 'string')
    const metadata = new ResultMetadata(status, schema, options.strict, options.desc)
    resultMetadata = resultMetadata.set(metadata.status, metadata)
    Reflect.defineMetadata(MetadataKey.RESULT, resultMetadata, target, propertyKey)
  }
}

export interface IErrorOptions {
  status: number
  type?: any
  schema?: IJsonSchema
  strict?: boolean
  desc?: string
}

export function ErrorResponse(options: IErrorOptions): PropertyDecorator {
  return (target: any, propertyKey: string) => {
    let resultMetadata: Map<number, ResultMetadata> =
      Reflect.getOwnMetadata(MetadataKey.RESULT, target, propertyKey) || Map()
    const status = options.status || HttpStatusCode.OK
    const schema = options.schema ? options.schema : normalizeSimpleSchema(options.type || 'string')
    const metadata = new ResultMetadata(status, schema, options.strict, options.desc)
    resultMetadata = resultMetadata.set(metadata.status, metadata)
    Reflect.defineMetadata(MetadataKey.RESULT, resultMetadata, target, propertyKey)
  }
}
