import { List } from 'immutable'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { IJsonSchema, normalizeSchema } from '../lib/utils'
import { PropertyDecorator } from '../types/PropertyDecorator'
export interface IResultOptions {
  type?: any
  desc?: string
  isGeneric?: boolean
}

export interface IResultMetadata {
  status: number
  schema?: IJsonSchema
  rawSchema?: any
  isGeneric?: boolean
  desc?: string
}

export function Result(options: IResultOptions): PropertyDecorator {
  return (target: any, propertyKey: string) => {
    let resultMetadata: List<IResultMetadata> =
      Reflect.getOwnMetadata(MetadataKey.RESULT, target, propertyKey) || List()
    const metadata: IResultMetadata = {
      status: 200,
      rawSchema: options.type,
      desc: options.desc
    }
    if (options.isGeneric) {
      metadata.rawSchema = options.type
    } else {
      if (!options.type) {
        throw new TypeError('Type is required.')
      }
      metadata.schema = options.type ? normalizeSchema(options.type) : undefined
    }
    resultMetadata = resultMetadata.push(metadata)
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
