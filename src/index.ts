import { DataType } from 'luren-schema'

export * from './Luren'
export * from './constants'
export * from './decorators'
export * from './lib'
export * from './datasource'

DataType.add('file', {
  json: {
    type: 'string',
    additionalProps: { format: 'binary' }
  }
})
DataType.add('stream', {
  json: {
    type: 'string',
    additionalProps: {
      format: 'binary'
    }
  }
})
