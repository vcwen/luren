import { Map } from 'immutable'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { Constructor } from '../types/Constructor'
import { PropMetadata } from './Prop'

export interface ISchemaOptions {
  id?: string
  strict?: boolean
  desc?: string
}

export class SchemaMetadata {
  public id: string
  public schema: any
  public strict: boolean = false
  public desc?: string
  constructor(id: string, schema: any, desc?: string) {
    this.id = id
    this.schema = schema
    this.desc = desc
  }
}

export function Schema(options: ISchemaOptions = {}) {
  return (constructor: Constructor<any>) => {
    const jsonSchema = {
      type: 'object',
      required: [] as string[],
      properties: {} as any,
      additionalProperties: options.strict ? true : false
    }
    const propMetadataMap: Map<string, PropMetadata> =
      Reflect.getMetadata(MetadataKey.PROPS, constructor.prototype) || Map()
    for (const [prop, propMetadata] of propMetadataMap) {
      jsonSchema.properties[prop] = Object.assign({}, propMetadata.schema, { name: propMetadata.name })
      if (propMetadata.required) {
        jsonSchema.required.push(prop)
      }
    }
    const metadata = new SchemaMetadata(options.id || constructor.name, jsonSchema, options.desc)
    Reflect.defineMetadata(MetadataKey.SCHEMA, metadata, constructor.prototype)
  }
}
