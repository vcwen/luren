import { Map } from 'immutable'
import { IJsSchema, JsType, JsTypes, SimpleType, utils } from 'luren-schema'
import mime from 'mime'
import 'reflect-metadata'
import { HttpStatusCode } from '../constants'
import { MetadataKey } from '../constants/MetadataKey'
import { normalizeHeaderCase } from '../lib/utils'
import { PropertyDecorator } from '../types/PropertyDecorator'

export interface IResponseOptions {
  status?: number
  type?: SimpleType
  schema?: IJsSchema
  desc?: string
  mime?: string
  headers?: { [name: string]: any }
  example?: any
}

export class ResponseMetadata {
  public status: number = HttpStatusCode.OK
  public desc?: string
  public schema: IJsSchema
  public headers?: { [name: string]: any }
  public example?: any
  constructor(status: number, schema: IJsSchema, desc?: string) {
    this.status = status
    this.schema = schema
    if (desc) {
      this.desc = desc
    }
  }
}

export function Response(options: IResponseOptions = {}): PropertyDecorator {
  return (target: any, propertyKey: string) => {
    let resMetadata: Map<number, ResponseMetadata> =
      Reflect.getOwnMetadata(MetadataKey.RESPONSE, target, propertyKey) || Map()
    const status = options.status || HttpStatusCode.OK
    const schema: IJsSchema = options.schema
      ? options.schema
      : utils.convertSimpleSchemaToJsSchema(options.type || 'string')[0]
    const metadata = new ResponseMetadata(status, schema, options.desc)
    metadata.headers = normalizeHeaderCase(options.headers || {})

    if (options.example) {
      const vr = JsTypes.validate(options.example, schema)
      if (!vr.valid) {
        throw vr.error!
      } else {
        metadata.example = options.example
      }
    }

    if (options.mime) {
      const mimeType = mime.getType(options.mime)
      Reflect.set(metadata.headers, 'Content-Type', mimeType ? mimeType : options.mime)
    }
    if ((schema.type === 'file' || schema.type === 'stream') && !metadata.headers['Content-Type']) {
      Reflect.set(metadata.headers, 'Content-Type', 'application/octet-stream')
    }
    resMetadata = resMetadata.set(metadata.status, metadata)
    Reflect.defineMetadata(MetadataKey.RESPONSE, resMetadata, target, propertyKey)
  }
}

export interface IErrorOptions {
  status: number
  type?: any
  schema?: IJsSchema
  desc?: string
  example?: any
}

export function ErrorResponse(options: IErrorOptions): PropertyDecorator {
  return (target: any, propertyKey: string) => {
    let resMetadata: Map<number, ResponseMetadata> =
      Reflect.getOwnMetadata(MetadataKey.RESPONSE, target, propertyKey) || Map()
    const status = options.status
    const schema = options.schema ? options.schema : utils.convertSimpleSchemaToJsSchema(options.type || 'string')[0]
    const metadata = new ResponseMetadata(status, schema, options.desc)
    if (options.example) {
      metadata.example = options.example
    }
    resMetadata = resMetadata.set(metadata.status, metadata)

    Reflect.defineMetadata(MetadataKey.RESPONSE, resMetadata, target, propertyKey)
  }
}
