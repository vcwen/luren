import { List } from 'immutable'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { IJsonSchema, jsonSchemaToStructSchema, normalizeSimpleSchema } from '../lib/utils'

export interface IParamOptions {
  name?: string
  source?: 'query' | 'path' | 'header' | 'body' | 'context'
  type?: string | { [prop: string]: any }
  schema?: IJsonSchema
  required?: boolean
  desc?: string
  root?: boolean
  format?: 'string'
  strict?: boolean
}

export class ParamMetadata {
  public name: string
  public source: 'query' | 'path' | 'header' | 'body' | 'file' | 'context'
  public schema!: IJsonSchema
  public required: boolean = false
  public root: boolean = false
  public format?: string
  public strict: boolean = true
  public desc?: string
  public struct: any
  constructor(name: string, source: 'query' | 'path' | 'header' | 'body' | 'context', required: boolean = false) {
    this.name = name
    this.source = source
    this.required = required
  }
}

const getParamMetadata = (options: IParamOptions, index: number, target: object, propertyKey: string) => {
  const metadata = new ParamMetadata(options.name || propertyKey, options.source || 'query', options.required)
  if (options.schema) {
    metadata.schema = options.schema
  } else {
    metadata.schema = normalizeSimpleSchema(options.type || 'string')
  }
  if (options.root) {
    metadata.root = true
  }
  if (options.strict) {
    metadata.strict = true
  }
  metadata.format = options.format
  metadata.struct = jsonSchemaToStructSchema(metadata.schema, options.required, options.strict)
  const paramsMetadata: List<any> = Reflect.getOwnMetadata(MetadataKey.PARAM, target, propertyKey) || List()
  if (paramsMetadata.has(index)) {
    const existingMetadata = paramsMetadata.get(index) || {}
    return Object.assign({}, existingMetadata, metadata)
  } else {
    return metadata
  }
}

const defineParamMetadata = (options: IParamOptions, index: number, target: object, propertyKey: string) => {
  const paramMetadata = getParamMetadata(options, index, target, propertyKey)
  const paramsMetadata: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAM, target, propertyKey) || List()
  Reflect.defineMetadata(MetadataKey.PARAM, paramsMetadata.set(index, paramMetadata), target, propertyKey)
}

export function Param(options: IParamOptions = {}) {
  return (target: object, propertyKey: string, index: number) => {
    defineParamMetadata(options, index, target, propertyKey)
  }
}

export function Required(options: IParamOptions = {}) {
  return (target: object, propertyKey: string, index: number) => {
    defineParamMetadata(Object.assign({}, options, { required: true }), index, target, propertyKey)
  }
}
