import { Map } from 'immutable'
import { IJsSchema, SimpleType } from 'luren-schema'
import 'reflect-metadata'
import { HttpStatusCode } from '../constants'
import { MetadataKey } from '../constants/MetadataKey'
import { normalizeHeaderCase } from '../lib/utils'
import { PropertyDecorator } from '../types/PropertyDecorator'
import { GenericType } from '../lib/GenericType'

export interface IResponseOptions {
  status?: number
  type?: SimpleType | GenericType
  schema?: IJsSchema
  desc?: string
  contentType?: string
  headers?: { [name: string]: any }
  example?: any
}

export class ResponseMetadata {
  public status: number
  public type?: SimpleType | GenericType
  public required: boolean = true
  public schema?: IJsSchema
  public desc?: string
  public contentType?: string
  public headers?: { [name: string]: any }
  public example?: any
  constructor(status: number = HttpStatusCode.OK) {
    this.status = status
  }
}

export function Response(options: IResponseOptions = {}, mergeParentResponse: boolean = false): PropertyDecorator {
  return (target: any, propertyKey: string) => {
    let resMetadata: Map<number, ResponseMetadata>
    if (mergeParentResponse) {
      resMetadata = Reflect.getMetadata(MetadataKey.RESPONSE, target, propertyKey) || Map()
    } else {
      resMetadata = Reflect.getOwnMetadata(MetadataKey.RESPONSE, target, propertyKey) || Map()
    }
    const status = options.status || HttpStatusCode.OK
    const metadata = new ResponseMetadata(status)
    metadata.type = options.type
    metadata.schema = options.schema
    metadata.headers = normalizeHeaderCase(options.headers || {})
    metadata.example = options.example
    metadata.contentType = options.contentType
    metadata.desc = options.desc
    resMetadata = resMetadata.set(metadata.status, metadata)
    Reflect.defineMetadata(MetadataKey.RESPONSE, resMetadata, target, propertyKey)
  }
}

export interface IErrorOptions extends IResponseOptions {
  status: number
}

export function ErrorResponse(options: IErrorOptions): PropertyDecorator {
  return Response(options)
}
