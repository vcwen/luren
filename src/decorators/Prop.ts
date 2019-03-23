import { Map } from 'immutable'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { IJsonSchema, normalizeSimpleSchema } from '../lib/utils'

export interface IPropOptions {
  name?: string
  type?: string | { [prop: string]: any }
  schema?: IJsonSchema
  required?: boolean
  desc?: string
  format?: 'string'
  enum?: any[]
  const?: any
  strict?: boolean
  private?: boolean
}

export class PropMetadata {
  public name: string
  public schema!: IJsonSchema
  public required: boolean = false
  public format?: string
  public strict: boolean = true
  public enum?: any[]
  public const?: any
  public desc?: string
  public private: boolean = false
  constructor(name: string, required: boolean = false) {
    this.name = name
    this.required = required
  }
}

const getPropMetadata = (options: IPropOptions, _1: object, propertyKey: string) => {
  const metadata = new PropMetadata(options.name || propertyKey, options.required)
  if (options.schema) {
    metadata.schema = options.schema
  } else {
    metadata.schema = normalizeSimpleSchema(options.type || 'string')
  }
  metadata.strict = options.strict || false
  metadata.format = options.format
  metadata.enum = options.enum
  metadata.const = options.const
  metadata.private = options.private || false
  if (metadata.private) {
    metadata.schema.private = true
  }
  return metadata
}

export function Prop(options: IPropOptions = {}) {
  return (target: object, propertyKey: string) => {
    let metadataMap: Map<string, PropMetadata> = Reflect.getMetadata(MetadataKey.PROPS, target) || Map()
    const metadata = getPropMetadata(options, target, propertyKey)
    Reflect.defineMetadata(MetadataKey.PROP, metadata, target, propertyKey)
    metadataMap = metadataMap.set(propertyKey, metadata)
    Reflect.defineMetadata(MetadataKey.PROPS, metadataMap, target, propertyKey)
  }
}
