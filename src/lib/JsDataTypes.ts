import { createJsDataTypes, defineSchema, IJsSchema } from 'luren-schema'
import IncomingFile from './IncomingFile'

export const JsDataTypes = createJsDataTypes()

defineSchema(IncomingFile, { type: 'file' })

JsDataTypes.add('file', {
  validate(_1: IJsSchema, _2: any) {
    return [true, '']
  },
  serialize(_1: IJsSchema, data: any) {
    return data
  },
  deserialize(_1: IJsSchema, data: any) {
    return data
  },
  toJsonSchema() {
    return {
      type: 'string',
      format: 'binary'
    }
  }
})
JsDataTypes.add('stream', {
  validate(_1: IJsSchema, _2: any) {
    return [true, '']
  },
  serialize(_1: IJsSchema, data: any) {
    return data
  },
  deserialize(_1: IJsSchema, data: any) {
    return data
  },
  toJsonSchema() {
    return {
      type: 'string',
      format: 'binary'
    }
  }
})
