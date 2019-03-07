import Ajv from 'ajv'
import { promises as fs } from 'fs'
import _ from 'lodash'
import Path from 'path'
import 'reflect-metadata'
import { struct } from 'superstruct'
import { MetadataKey } from '../constants/MetadataKey'
import { SchemaMetadata } from '../decorators/Schema'
import { IFileLoaderConfig, IFileLoaderOptions } from '../Luren'

export interface IJsonSchema {
  title?: string
  type: string
  format?: string
  properties?: { [prop: string]: IJsonSchema }
  items?: IJsonSchema
  required?: string[]
  description?: string
  [prop: string]: any
}

const normalizeType = (type: string): [string, boolean] => {
  const regex = /(\w+?)(\?)?$/
  const match = regex.exec(type)
  if (match) {
    const prop = match[1]
    // tslint:disable-next-line:no-magic-numbers
    if (match[2]) {
      return [prop, false]
    } else {
      return [prop, true]
    }
  } else {
    throw new Error('Invalid type:' + type)
  }
}

const normalizeProp = (decoratedProp: string): [string, boolean] => {
  const regex = /(\w+?)(\?)?$/
  const match = regex.exec(decoratedProp)
  if (match) {
    const prop = match[1]
    // tslint:disable-next-line:no-magic-numbers
    if (match[2]) {
      return [prop, false]
    } else {
      return [prop, true]
    }
  } else {
    throw new Error('Invalid prop:' + decoratedProp)
  }
}

const convertSimpleSchemaToJsonSchema = (schema: any): [any, boolean] => {
  if (typeof schema === 'string') {
    const [type, required] = normalizeType(schema)
    return [{ type }, required]
  } else if (Array.isArray(schema)) {
    const propSchema: any = { type: 'array' }
    if (schema[0]) {
      const itemSchema = convertSimpleSchemaToJsonSchema(schema[0])
      propSchema.items = itemSchema
    } else {
      throw new TypeError('Array items is required.')
    }
    return propSchema
  } else if (typeof schema === 'object') {
    const jsonSchema: IJsonSchema = { type: 'object', properties: {} }
    const requiredProps = [] as string[]
    for (const prop in schema) {
      if (schema.hasOwnProperty(prop)) {
        const [propSchema, propRequired] = convertSimpleSchemaToJsonSchema(schema[prop])
        const [propName, required] = normalizeProp(prop)
        if (jsonSchema.properties) {
          jsonSchema.properties[propName] = propSchema
        }
        if (required && propRequired) {
          requiredProps.push(propName)
        }
      }
    }
    if (!_.isEmpty(requiredProps)) {
      jsonSchema.required = requiredProps
    }
    return [jsonSchema, false]
  } else if (typeof schema === 'function') {
    const schemaMetadata: SchemaMetadata = Reflect.getMetadata(MetadataKey.SCHEMA, schema)
    return [schemaMetadata.schema, false]
  } else {
    throw new TypeError('Invalid schema:' + schema)
  }
}

export const normalizeSimpleSchema = (schema: any): IJsonSchema => {
  if (_.isEmpty(schema)) {
    throw new Error('Invalid schema.')
  }
  const [jsonSchema] = convertSimpleSchemaToJsonSchema(schema)
  return jsonSchema
}

const isPrimitiveType = (type: string) => {
  return !(type === 'object' || type === 'array')
}

export const jsonSchemaToStructSchema = (schema: IJsonSchema, required: boolean = false, strict: boolean = false) => {
  let structSchema: any = {}
  if (Array.isArray(schema.type)) {
    struct.union(schema.type)
  } else {
    if (isPrimitiveType(schema.type)) {
      structSchema = schema.type
    } else if (schema.type === 'array') {
      if (schema.items && !_.isEmpty(schema.items)) {
        structSchema = struct.list([jsonSchemaToStructSchema(schema.items)])
      } else {
        structSchema = 'array'
      }
    } else {
      if (schema.properties) {
        const schemaDetail = schema.properties
        const requiredProps = schema.required || ([] as string[])
        for (const prop in schemaDetail) {
          if (schemaDetail.hasOwnProperty(prop)) {
            structSchema[prop] = jsonSchemaToStructSchema(schemaDetail[prop], requiredProps.includes(prop), strict)
          }
        }
        if (!strict) {
          structSchema = struct.partial(structSchema)
        }
      } else {
        structSchema = 'object'
      }
    }
  }

  if (required) {
    return struct(structSchema)
  } else {
    return struct.optional(structSchema)
  }
}
const ajv = new Ajv()
export const transform = (value: any, schema: any, rootSchema: any) => {
  if (schema.allOf) {
    schema = _.merge({}, ...(schema.allOf as any[]))
  }
  if (schema.$ref) {
    // reference, only support embedded definitions
    const path = _.tail(schema.$ref.split('/')).join('.')
    const ref = _.get(rootSchema, path)
    schema = _.merge(_.omit(schema, '$ref'), ref)
  }
  if (schema.type) {
    if (schema.type === 'object') {
      const result = {} as any
      const props = Object.getOwnPropertyNames(schema.properties)
      for (const prop of props) {
        result[prop] = transform(value[prop], schema.properties[prop], rootSchema)
      }
      if (schema.additionalProperties) {
        const otherProps = _.difference(Object.getOwnPropertyNames(value), props)
        for (const p of otherProps) {
          result[p] = value[p]
        }
      }
      return result
    } else if (schema.type === 'array') {
      const items: any[] = value
      return items.map((item) => transform(item, schema.items, rootSchema))
    } else {
      return value
    }
  } else {
    if (schema.anyOf) {
      // find the first valid one and use it
      const schemas = schema.anyOf as any[]
      for (const s of schemas) {
        if (ajv.validate(s, value)) {
          return transform(value, s, rootSchema)
        }
      }
    } else if (schema.oneOf) {
      // find the first valid one and use it
      const schemas = schema.anyOf as any[]
      for (const s of schemas) {
        if (ajv.validate(s, value)) {
          return transform(value, s, rootSchema)
        }
      }
    } else {
      // when no above keys, it might be 'const' or 'enum' without type
      return value
    }
  }
}

export const importModule = async (path: string, base?: string) => {
  if (base) {
    path = Path.resolve(base, path)
  }
  const files = await fs.readdir(path)
  for (const file of files) {
    if ((file.endsWith('.js') || file.endsWith('.ts')) && !file.endsWith('.d.ts')) {
      await import(Path.resolve(path, file))
    }
  }
}

export const importFiles = async (config: IFileLoaderConfig) => {
  const files = await fs.readdir(config.path)
  const pattern = config.pattern
  const defaultExcludePattern = /(^\.)|(\.d\.ts$)/
  const defaultIncludePattern = /\.[t|j]s$/
  for (const file of files) {
    const stat = await fs.lstat(Path.resolve(config.path, file))
    if (stat.isDirectory()) {
      await importFiles({ path: Path.resolve(config.path, file), pattern })
    } else {
      if ((pattern.exclude && pattern.exclude.test(file)) || defaultExcludePattern.test(file)) {
        break
      }
      if (defaultIncludePattern.test(file) && (pattern.include && pattern.include.test(file))) {
        await import(Path.resolve(config.path, file))
      }
    }
  }
}

export const getFileLoaderConfig = (options: IFileLoaderOptions) => {
  const basePath = options.base || process.cwd()
  const path = Path.resolve(basePath, options.path)
  const conf: IFileLoaderConfig = {
    path,
    pattern: {}
  }
  if (options.pattern) {
    if (options.pattern instanceof RegExp) {
      conf.pattern.include = options.pattern
    } else {
      if (options.pattern.include) {
        conf.pattern.include = options.pattern.include
      }
      if (options.pattern.exclude) {
        conf.pattern.include = options.pattern.include
      }
    }
  }
  return conf
}
