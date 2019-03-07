import { Container } from 'inversify'
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
const container = new Container()
container.getAllTagged('tet', '2', '23')

export function Schema(options: ISchemaOptions = {}) {
  return (constructor: Constructor) => {
    const jsonSchema = {
      type: 'object',
      required: [] as any[],
      properties: {} as any,
      additionalProperties: options.strict ? true : false
    }
    const props = Object.keys(constructor)
    for (const prop of props) {
      const propMetadata: PropMetadata = Reflect.getMetadata(MetadataKey.PROP, constructor, prop)
      if (propMetadata) {
        jsonSchema.properties[prop] = propMetadata.schema
        if (propMetadata.required) {
          jsonSchema.required.push(prop)
        }
      }
    }
    const metadata = new SchemaMetadata(options.id || constructor.name, jsonSchema, options.desc)
    Reflect.defineMetadata(MetadataKey.SCHEMA, metadata, constructor)
  }
}
