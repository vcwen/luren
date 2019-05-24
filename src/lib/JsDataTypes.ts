import { createJsDataTypes } from 'luren-schema'

export const JsDataTypes = createJsDataTypes()

JsDataTypes.add('file', {
  json: {
    type: 'string',
    additionalProps: { format: 'binary' }
  }
})
JsDataTypes.add('stream', {
  json: {
    type: 'string',
    additionalProps: {
      format: 'binary'
    }
  }
})
