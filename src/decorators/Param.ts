import { List } from 'immutable'
import _ from 'lodash'
import { IJsSchema, SimpleType } from 'luren-schema'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { ParamSource } from '../constants/ParamSource'
import { GenericType } from '../lib/GenericType'

export type Source = 'query' | 'path' | 'header' | 'body' | 'session' | 'request' | 'context' | 'next'

type ParamDecorator = (target: object, propertyKey: string, index: number) => void
export interface IParamOptions {
  name?: string
  in?: Source
  type?: SimpleType | GenericType
  schema?: IJsSchema
  required?: boolean
  desc?: string
  root?: boolean
  format?: string
  mime?: string
  default?: any
  example?: any
}

export class ParamMetadata {
  public name: string
  public source: Source
  public type?: SimpleType | GenericType
  public schema?: IJsSchema
  public required?: boolean
  public root: boolean = false
  public format?: string
  public mime?: string
  public desc?: string
  public default: any
  public example?: any
  constructor(name: string, source: Source, required?: boolean) {
    this.name = name
    this.source = source
    this.required = required
  }
}

export function Param(options: IParamOptions) {
  return (target: object, propertyKey: string, index: number) => {
    const paramMetadata = new ParamMetadata(options.name ?? '', options.in || ParamSource.QUERY, options.required)
    paramMetadata.type = options.type
    paramMetadata.schema = options.schema
    paramMetadata.root = options.root || false
    if (options.format) {
      paramMetadata.format = options.format
    }
    if (options.desc) {
      paramMetadata.desc = options.desc
    }
    if (options.mime) {
      paramMetadata.mime = options.mime
    }
    if (options.default) {
      paramMetadata.default = options.default
    }
    if (options.example) {
      paramMetadata.example = options.example
    }
    let paramsMetadata: List<ParamMetadata> = Reflect.getOwnMetadata(MetadataKey.PARAMS, target, propertyKey) ?? List()
    paramsMetadata = paramsMetadata.set(index, paramMetadata)
    Reflect.defineMetadata(MetadataKey.PARAMS, paramsMetadata, target, propertyKey)
  }
}

export function InQuery(name: string, type: SimpleType | GenericType, required?: boolean): ParamDecorator
export function InQuery(name: string, required?: boolean): ParamDecorator
export function InQuery() {
  return inSource(ParamSource.QUERY).apply(null, [...arguments])
}

export function InPath(name: string, type?: SimpleType | GenericType) {
  return inSource(ParamSource.PATH).apply(null, [name, type, true])
}

export function InHeader(name: string, type: SimpleType | GenericType, required?: boolean): ParamDecorator
export function InHeader(name: string, required?: boolean): ParamDecorator
export function InHeader() {
  return inSource(ParamSource.HEADER).apply(null, [...arguments])
}

export function InBody(name: string, type: SimpleType | GenericType, required?: boolean): ParamDecorator
export function InBody(name: string, required?: boolean): ParamDecorator
export function InBody() {
  return inSource(ParamSource.BODY).apply(null, [...arguments])
}
export function InRequest(name: string, type: SimpleType | GenericType, required?: boolean): ParamDecorator
export function InRequest(name: string, required?: boolean): ParamDecorator
export function InRequest() {
  return inSource(ParamSource.REQUEST).apply(null, [...arguments])
}
export function InSession(name: string, type: SimpleType | GenericType, required?: boolean): ParamDecorator
export function InSession(name: string, required?: boolean): ParamDecorator
export function InSession() {
  return inSource(ParamSource.SESSION).apply(null, [...arguments])
}
export function InContext(name: string, type: SimpleType | GenericType, required?: boolean): ParamDecorator
export function InContext(name: string, required?: boolean): ParamDecorator
export function InContext() {
  return inSource(ParamSource.CONTEXT).apply(null, [...arguments])
}

export function Query() {
  return Param({ in: ParamSource.QUERY, root: true, type: 'object' })
}
export function Context() {
  return Param({ in: ParamSource.CONTEXT, root: true, type: 'object' })
}
export function Request() {
  return Param({ in: ParamSource.REQUEST, root: true, type: 'object' })
}
export function Session() {
  return Param({ in: ParamSource.SESSION, root: true, type: 'object' })
}
export function Body(type: SimpleType = 'object') {
  return Param({ in: ParamSource.BODY, root: true, type })
}

export function Next() {
  return Param({ in: ParamSource.NEXT, type: 'function' })
}

export function inSource(source: ParamSource) {
  return (...args: any[]) => {
    let name: string
    let type: SimpleType = 'string'
    let required: boolean | undefined
    if (args.length === 0) {
      throw new Error('name is required')
    }
    name = _.get(args, 0)
    if (args.length === 2 && typeof _.get(args, 1) === 'boolean') {
      required = _.get(args, 1)
    } else {
      type = _.get(args, 1, 'string')
      required = _.get(args, 2)
    }
    return Param({ name, type, required, in: source })
  }
}
