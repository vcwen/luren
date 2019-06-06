import { List } from 'immutable'
import _ from 'lodash'
import { IJsSchema, normalizeSimpleSchema, SimpleType } from 'luren-schema'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { ParamSource } from '../constants/ParamSource'

export type Source = 'query' | 'path' | 'header' | 'body' | 'session' | 'request' | 'context'

type ParamDecorator = (target: object, propertyKey: string, index: number) => void
export interface IParamOptions {
  name?: string
  in?: Source
  type?: SimpleType
  schema?: IJsSchema
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
  public schema: IJsSchema
  public required: boolean = false
  public root: boolean = false
  public format?: string
  public strict: boolean = true
  public mime?: string
  public desc?: string
  constructor(name: string = '', source: Source, schema: IJsSchema, required: boolean = false) {
    this.name = name
    this.source = source
    this.schema = schema
    this.required = required
  }
}

const getParamMetadata = (options: IParamOptions, index: number, target: object, propertyKey: string) => {
  let paramSchema: IJsSchema
  let paramRequired = options.required
  if (options.schema) {
    paramSchema = options.schema
  } else {
    const [schema, required] = normalizeSimpleSchema(options.type || 'string')
    paramSchema = schema
    if (typeof paramRequired !== 'boolean') {
      paramRequired = required
    }
  }
  const metadata = new ParamMetadata(options.name, options.in || ParamSource.QUERY, paramSchema, paramRequired)
  metadata.root = options.root || false
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
export function Required(name: string): (target: object, propertyKey: string, index: number) => void
// tslint:disable-next-line: unified-signatures
export function Required(options: IParamOptions): (target: object, propertyKey: string, index: number) => void
export function Required(options: any) {
  if (typeof options === 'string') {
    options = { name: options }
  }
  return (target: object, propertyKey: string, index: number) => {
    defineParamMetadata(Object.assign({}, options, { required: true }), index, target, propertyKey)
  }
}

export function InQuery(name: string, type: SimpleType, required?: boolean): ParamDecorator
export function InQuery(name: string, required?: boolean): ParamDecorator
export function InQuery() {
  return inSource(ParamSource.QUERY).apply(null, [...arguments])
}

export function InPath(name: string, type?: SimpleType) {
  return inSource(ParamSource.PATH).apply(null, [name, type, true])
}

export function InHeader(name: string, type: SimpleType, required?: boolean): ParamDecorator
export function InHeader(name: string, required?: boolean): ParamDecorator
export function InHeader() {
  return inSource(ParamSource.HEADER).apply(null, [...arguments])
}

export function InBody(name: string, type: SimpleType, required?: boolean): ParamDecorator
export function InBody(name: string, required?: boolean): ParamDecorator
export function InBody() {
  return inSource(ParamSource.BODY).apply(null, [...arguments])
}
export function InRequest(name: string, type: SimpleType, required?: boolean): ParamDecorator
export function InRequest(name: string, required?: boolean): ParamDecorator
export function InRequest() {
  return inSource(ParamSource.REQUEST).apply(null, [...arguments])
}
export function InSession(name: string, type: SimpleType, required?: boolean): ParamDecorator
export function InSession(name: string, required?: boolean): ParamDecorator
export function InSession() {
  return inSource(ParamSource.SESSION).apply(null, [...arguments])
}
export function InContext(name: string, type: SimpleType, required?: boolean): ParamDecorator
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
export function Body() {
  return Param({ in: ParamSource.BODY, root: true, type: 'object' })
}

function inSource(source: ParamSource) {
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
