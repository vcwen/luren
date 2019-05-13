import { DataType } from 'luren-schema'

export * from './Luren'
export * from './constants'
export * from './decorators'
export * from './lib'
export * from './datasource'
export {
  Schema,
  SchemaMetadata,
  ISchemaOptions,
  Prop,
  PropMetadata,
  IPropOptions,
  defineSchema,
  IJsonOptions,
  IJsSchema,
  normalizeSimpleSchema,
  validate,
  serialize,
  deserialize,
  jsSchemaToJsonSchema,
  DataType
} from 'luren-schema'

DataType.add('file', {
  json: {
    additionalProps: { format: 'binary' }
  }
})
DataType.add('stream', {
  json: {
    additionalProps: {
      format: 'binary'
    }
  }
})
