import { createJsDataTypes } from 'luren-schema'

export const JsDataTypes = createJsDataTypes()

JsDataTypes.add('file', {
  toJsonSchema() {
    return {
      type: 'string',
      format: 'binary'
    }
  }
})
JsDataTypes.add('stream', {
  toJsonSchema() {
    return {
      type: 'string',
      format: 'binary'
    }
  }
})
