import { MetadataKey as SchemaMetadataKey } from 'luren-schema'
export const MetadataKey = {
  CONTROLLER: Symbol('CONTROLLER'),
  MIDDLEWARE: Symbol('MIDDLEWARE'),
  ROUTES: Symbol('ROUTES'),
  PARAMS: Symbol('PARAMS'),
  RESPONSE: Symbol('RESPONSE'),
  INDEX: Symbol('INDEX'),
  MODEL: Symbol('MODEL'),
  SCHEMA: SchemaMetadataKey.SCHEMA,
  PROPS: SchemaMetadataKey.PROPS
}

export default MetadataKey
