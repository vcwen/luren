import { DataTypes, defineSchema, JsType } from 'luren-schema'
import { Stream } from 'stream'
import IncomingFile from './IncomingFile'

defineSchema(IncomingFile, { type: 'file' })

class FileType extends JsType {
  public type: string = 'file'
  public validate(value: any): [boolean, string?] {
    const valid = value instanceof IncomingFile
    if (valid) {
      return [true]
    } else {
      return [false, `invalid file type:${value}`]
    }
  }
  public serialize() {
    throw new Error('serialize is not supported')
  }
  public deserialize() {
    throw new Error('deserialize is not supported')
  }
  public toJsonSchema() {
    return {
      type: 'string',
      format: 'binary'
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
class StreamType extends JsType {
  public type: string = 'stream'
  public validate(value: any): [boolean, string?] {
    const valid = value instanceof Stream
    if (valid) {
      return [true]
    } else {
      return [false, `invalid stream type:${value}`]
    }
  }
  public serialize() {
    throw new Error('serialize is not supported')
  }
  public deserialize() {
    throw new Error('deserialize is not supported')
  }
  public toJsonSchema() {
    return {
      type: 'string',
      format: 'binary'
    }
  }
}

DataTypes.register('file', new FileType())

DataTypes.register('stream', new StreamType())
