import { List } from 'immutable'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { IJsonSchema, normalizeSchema } from '../lib/utils'
import { PropertyDecorator } from '../types/PropertyDecorator'
export interface IResultOptions {
  type?: any
  desc?: string
}

export interface IResultMetadata {
  status: number
  schema?: IJsonSchema
  desc?: string
}

export function Result(options: IResultOptions): PropertyDecorator {
  return (target: any, propertyKey: string) => {
    let resultMetadata: List<IResultMetadata> =
      Reflect.getOwnMetadata(MetadataKey.RESULT, target, propertyKey) || List()
    resultMetadata = resultMetadata.push({
      status: 200,
      schema: options.type ? normalizeSchema(options.type) : undefined,
      desc: options.desc
    })
    Reflect.defineMetadata(MetadataKey.RESULT, resultMetadata, target, propertyKey)
  }
}

export interface IErrorOptions {
  status: number
  type?: any
  desc?: string
}

export function ErrorResponse(options: IErrorOptions): PropertyDecorator {
  return (target: any, propertyKey: string) => {
    let resultMetadata: List<IResultMetadata> =
      Reflect.getOwnMetadata(MetadataKey.RESULT, target, propertyKey) || List()
    resultMetadata = resultMetadata.push({
      status: options.status,
      schema: options.type ? normalizeSchema(options.type) : undefined,
      desc: options.desc
    })
    Reflect.defineMetadata(MetadataKey.RESULT, resultMetadata, target, propertyKey)
  }
}
