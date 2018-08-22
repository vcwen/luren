import { List } from 'immutable'
import { clone, defaults } from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { IJsonSchema, normalizeSchema, structSchemaFromJsonSchema } from '../lib/utils'

export interface IParamOptions {
  name: string
  source?: 'query' | 'path' | 'header' | 'body' | 'context'
  type?: any
  required?: boolean
  desc?: string
  root?: boolean
  format?: 'string'
}

export interface IParamMetadata {
  name: string
  source: 'query' | 'path' | 'header' | 'body' | 'context'
  schema: IJsonSchema
  required: boolean
  root: boolean
  desc?: string
  struct: any
}

const getParamMetadata = (options: any, index: number, target: object, propertyKey: string) => {
  options = clone(options)
  const paramsMetadata: List<any> = Reflect.getOwnMetadata(MetadataKey.PARAM, target, propertyKey) || List()
  if (paramsMetadata.has(index)) {
    const existingOptions = paramsMetadata.get(index) || {}
    options = Object.assign({}, existingOptions, options)
  }
  defaults(options, {
    name: propertyKey,
    source: 'query',
    type: 'string',
    required: false,
    root: false
  })
  options.schema = normalizeSchema(options.type)
  options.struct = structSchemaFromJsonSchema(options.schema, options.required)
  return options
}

const defineParamMetadata = (options: any, index: number, target: object, propertyKey: string) => {
  const paramMetadata = getParamMetadata(options, index, target, propertyKey)
  const paramsMetadata: List<any> = Reflect.getMetadata(MetadataKey.PARAM, target, propertyKey) || List()
  Reflect.defineMetadata(MetadataKey.PARAM, paramsMetadata.set(index, paramMetadata), target, propertyKey)
}

export function Param(options: IParamOptions) {
  return (target: object, propertyKey: string, index: number) => {
    defineParamMetadata(options, index, target, propertyKey)
  }
}

export function Required(options: IParamOptions) {
  return (target: object, propertyKey: string, index: number) => {
    defineParamMetadata(Object.assign({}, options, { required: true }), index, target, propertyKey)
  }
}
