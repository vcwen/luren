import _ from 'lodash'
import { IJsSchema, IValidationResult, JsType, JsTypes, ValidationResult } from 'luren-schema'
import { defineJsSchema } from 'luren-schema/dist/lib/utils'
import { Stream } from 'stream'
import { IncomingFile } from './IncomingFile'

defineJsSchema(IncomingFile, { type: 'file' })
defineJsSchema(Stream, { type: 'stream' })

class FileType extends JsType {
  public type: string = 'file'
  public validate(value: any): IValidationResult {
    if (_.isNil(value)) {
      return ValidationResult.ok()
    }
    if (value instanceof IncomingFile) {
      return ValidationResult.ok()
    } else {
      return ValidationResult.error(`invalid file type:${value}`)
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
JsTypes.register('file', new FileType())

// tslint:disable-next-line: max-classes-per-file
class StreamType extends JsType {
  public type: string = 'stream'
  public validate(value: any): IValidationResult {
    if (_.isNil(value)) {
      return ValidationResult.ok()
    }
    if (value instanceof Stream) {
      return ValidationResult.ok()
    } else {
      return ValidationResult.error(`invalid stream type:${value}`)
    }
  }
  public serialize(value: any) {
    const res = this.validate(value)
    if (res.valid) {
      return value
    } else {
      throw res.error
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
JsTypes.register('stream', new StreamType())
