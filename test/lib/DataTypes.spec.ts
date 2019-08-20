import fs from 'fs'
import { JsTypes, MetadataKey } from 'luren-schema'
import Path from 'path'
import { Stream } from 'stream'
import '../../src/lib/DataTypes'
import IncomingFile from '../../src/lib/IncomingFile'

describe('DataTypes', () => {
  it('should define schema in IncomingFile class', () => {
    const metadata = Reflect.getOwnMetadata(MetadataKey.SCHEMA, IncomingFile.prototype)
    expect(metadata.schema).toEqual({ type: 'file' })
  })

  it('should define schema in Stream class', () => {
    const metadata = Reflect.getOwnMetadata(MetadataKey.SCHEMA, Stream.prototype)
    expect(metadata.schema).toEqual({ type: 'stream' })
  })
  it('should  file type in DataTypes', () => {
    const jsType = JsTypes.get('file')
    expect(jsType.type).toBe('file')
  })
  it('should  stream stream in DataTypes', () => {
    const jsType = JsTypes.get('stream')
    expect(jsType.type).toBe('stream')
  })

  describe('type:file', () => {
    const fileType = JsTypes.get('file')
    it('validate', () => {
      const incomingFile = new IncomingFile('', '', '', 0)
      const [res1] = fileType.validate(incomingFile, { type: 'file' })
      expect(res1).toBeTruthy()
      const [res2] = fileType.validate('string', { type: 'file' })
      expect(res2).toBeFalsy()
    })
    it('deserialize', () => {
      const incomingFile = new IncomingFile('', '', '', 0)
      expect(fileType.deserialize(undefined, { type: 'file', default: incomingFile })).toEqual(incomingFile)
      expect(fileType.deserialize(incomingFile, { type: 'file' })).toEqual(incomingFile)
      expect(() => {
        fileType.deserialize(['foo'], { type: 'file' })
      }).toThrowError()
    })
    it('toJsonSchema', () => {
      expect(fileType.toJsonSchema({ type: 'file' })).toEqual({ type: 'string', format: 'binary' })
    })
  })
  describe('type:stream', () => {
    const streamType = JsTypes.get('stream')
    it('validate', () => {
      const stream = fs.createReadStream(Path.resolve(__dirname, __filename))
      const [res1] = streamType.validate(stream, { type: 'stream' })
      expect(res1).toBeTruthy()
      const [res2] = streamType.validate('string', { type: 'stream' })
      expect(res2).toBeFalsy()
    })
    it('deserialize', () => {
      const stream = fs.createReadStream(Path.resolve(__dirname, __filename))
      expect(streamType.deserialize(undefined, { type: 'stream', default: stream })).toEqual(stream)
      expect(streamType.deserialize(stream, { type: 'stream' })).toEqual(stream)
      expect(() => {
        streamType.deserialize(['foo'], { type: 'stream' })
      }).toThrowError()
    })
    it('toJsonSchema', () => {
      expect(streamType.toJsonSchema({ type: 'stream' })).toEqual({ type: 'string', format: 'binary' })
    })
  })
})
