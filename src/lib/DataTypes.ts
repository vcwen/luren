import _ from 'lodash'
import { IJsSchema, JsType, JsTypes } from 'luren-schema'
import { defineJsSchema } from 'luren-schema/dist/lib/utils'
import { Stream } from 'stream'
import IncomingFile from './IncomingFile'

defineJsSchema(IncomingFile, { type: 'file' })
defineJsSchema(Stream, { type: 'stream' })

class FileType extends JsType {
  public type: string = 'file'
  public validate(value: any): [boolean, string?] {
    if (_.isNil(value)) {
      return [true]
    }
    if (value instanceof IncomingFile) {
      return [true]
    } else {
      return [false, `invalid file type:${value}`]
    }
  }
  public deserialize(value: any, schema: IJsSchema) {
    if (_.isNil(value)) {
      return this.getDefaultValue(schema)
    } else {
      if (value instanceof IncomingFile) {
        return value
      } else {
        throw new Error(`Invalid file type: ${value}`)
      }
    }
  }
  public toJsonSchema() {
    return {
      type: 'string',
      format: 'binary'
    }
  }
}
JsTypes.register('file', new FileType(JsTypes))

// tslint:disable-next-line: max-classes-per-file
class StreamType extends JsType {
  public type: string = 'stream'
  public validate(value: any): [boolean, string?] {
    if (_.isNil(value)) {
      return [true]
    }
    if (value instanceof Stream) {
      return [true]
    } else {
      return [false, `invalid stream type:${value}`]
    }
  }
  public deserialize(value: any, schema: IJsSchema) {
    if (value === undefined) {
      return this.getDefaultValue(schema)
    } else {
      if (value instanceof Stream) {
        return value
      } else {
        throw new Error(`invalid stream value:${value}`)
      }
    }
  }
  public toJsonSchema() {
    return {
      type: 'string',
      format: 'binary'
    }
  }
}
JsTypes.register('stream', new StreamType(JsTypes))
