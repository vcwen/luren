import { List } from 'immutable'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { ParamSource } from '../constants/ParamSource'
import { IJsonSchema, normalizeSimpleSchema } from '../lib/utils'

export type Source = 'query' | 'path' | 'header' | 'body' | 'context'

type ParamDecorator = (target: object, propertyKey: string, index: number) => void
export interface IParamOptions {
  name: string
  in?: Source
  type?: string | { [prop: string]: any }
  schema?: IJsonSchema
  required?: boolean
  desc?: string
  root?: boolean
  format?: string
  strict?: boolean
  mime?: string
}

export class ParamMetadata {
  public name: string
  public source: Source
  public schema!: IJsonSchema
  public required: boolean = false
  public root: boolean = false
  public format?: string
  public strict: boolean = true
  public mime?: string
  public desc?: string
  public isFile: boolean = false
  constructor(name: string, source: Source, required: boolean = false) {
    this.name = name
    this.source = source
    this.required = required
  }
}

const getParamMetadata = (options: IParamOptions, index: number, target: object, propertyKey: string) => {
  const metadata = new ParamMetadata(options.name || '', options.in || ParamSource.QUERY, options.required)
  if (options.schema) {
    metadata.schema = options.schema
  } else {
    metadata.schema = normalizeSimpleSchema(options.type || 'string')
    if (options.type === 'file') {
      metadata.isFile = true
    }
  }
  if (options.root) {
    if (metadata.schema.type !== 'object') {
      throw new Error('parameter must be an object if it is root')
    }
    metadata.root = true
  }
  if (options.strict) {
    metadata.strict = true
  }
  metadata.format = options.format
  metadata.mime = options.mime
  const paramsMetadata: List<any> = Reflect.getOwnMetadata(MetadataKey.PARAMS, target, propertyKey) || List()
  if (paramsMetadata.has(index)) {
    const existingMetadata = paramsMetadata.get(index) || {}
    return Object.assign({}, existingMetadata, metadata)
  } else {
    return metadata
  }
}

const defineParamMetadata = (options: IParamOptions, index: number, target: object, propertyKey: string) => {
  const paramMetadata = getParamMetadata(options, index, target, propertyKey)
  const paramsMetadata: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, target, propertyKey) || List()
  Reflect.defineMetadata(MetadataKey.PARAMS, paramsMetadata.set(index, paramMetadata), target, propertyKey)
}

export function Param(options: IParamOptions) {
  return (target: object, propertyKey: string, index: number) => {
    defineParamMetadata(options, index, target, propertyKey)
  }
}
export function Required(name: string)
// tslint:disable-next-line: unified-signatures
export function Required(options: IParamOptions)
export function Required(options: any) {
  if (typeof options === 'string') {
    options = { name: options }
  }
  return (target: object, propertyKey: string, index: number) => {
    defineParamMetadata(Object.assign({}, options, { required: true }), index, target, propertyKey)
  }
}

export function InQuery(name: string, type: string, required?: boolean): ParamDecorator
export function InQuery(name: string, required?: boolean): ParamDecorator
export function InQuery() {
  return inSource(ParamSource.QUERY).apply(null, [...arguments])
}
export function InPath(name: string, type: string, required?: boolean): ParamDecorator
export function InPath(name: string, required?: boolean): ParamDecorator
export function InPath() {
  return inSource(ParamSource.PATH).apply(null, [...arguments])
}

export function InHeader(name: string, type: string, required?: boolean): ParamDecorator
export function InHeader(name: string, required?: boolean): ParamDecorator
export function InHeader() {
  return inSource(ParamSource.HEADER).apply(null, [...arguments])
}

export function InBody(name: string, type: string, required?: boolean): ParamDecorator
export function InBody(name: string, required?: boolean): ParamDecorator
export function InBody() {
  return inSource(ParamSource.BODY).apply(null, [...arguments])
}
export function Context() {
  return Param({ name: '', in: ParamSource.CONTEXT })
}

function inSource(source: ParamSource) {
  // tslint:disable-next-line: only-arrow-functions
  return function(...args: any[]) {
    let name: string
    let type: string = 'string'
    let required: boolean = false
    if (args.length === 0) {
      throw new Error('name is required')
    }
    name = _.get(args, 0)
    if (args.length === 2 && typeof _.get(args, 1) === 'boolean') {
      required = _.get(args, 1)
    } else {
      type = _.get(args, 1, 'string')
      required = _.get(args, 2, false)
    }
    return Param({ name, type, required, in: source })
  }
}
