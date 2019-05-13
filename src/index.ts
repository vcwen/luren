import { jsonDataType } from 'luren-schema'

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
  addType,
  defineSchema,
  IJsonOptions,
  IJsSchema,
  IncomingFile,
  normalizeSimpleSchema,
  validate,
  validateJson,
  serialize,
  deserialize,
  jsSchemaToJsonSchema,
  jsonDataType,
  dataType
} from 'luren-schema'

jsonDataType.add('file', { type: 'string', additionalProps: { format: 'binary' } })
jsonDataType.add('stream', {
  type: 'string',
  additionalProps: {
    format: 'binary'
  }
})
