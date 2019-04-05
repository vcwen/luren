import Ajv from 'ajv'
import { Fields, Files, IncomingForm } from 'formidable'
import { promises as fs } from 'fs'
import { IRouterContext } from 'koa-router'
import _ from 'lodash'
import Path from 'path'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { SchemaMetadata } from '../decorators/Schema'
import { IModuleLoaderConfig, IModuleLoaderOptions } from '../Luren'

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
    const jsonSchema: any = { type }
    if (type === 'file' || type === 'stream') {
      jsonSchema.type = 'object'
    }
    return [jsonSchema, required]
  } else if (Array.isArray(schema)) {
    const propSchema: any = { type: 'array' }
    if (schema[0]) {
      const [itemSchema] = convertSimpleSchemaToJsonSchema(schema[0])
      propSchema.items = itemSchema
    }
    return [propSchema, true]
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
  if (typeof schema === 'function') {
    const schemaMetadata: SchemaMetadata | undefined = Reflect.getMetadata(MetadataKey.SCHEMA, schema.prototype)
    if (schemaMetadata) {
      return schemaMetadata.schema
    } else {
      throw new Error('Invalid schema.')
    }
  }
  if (_.isEmpty(schema)) {
    throw new Error('Invalid schema.')
  }
  const [jsonSchema] = convertSimpleSchemaToJsonSchema(schema)
  return jsonSchema
}

const ajv = new Ajv()
export const transform = (value: any, schema: any, rootSchema: any): any => {
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
      if (!_.isEmpty(schema.properties)) {
        const props = Object.getOwnPropertyNames(schema.properties)
        for (const prop of props) {
          if (schema.properties[prop].private) {
            // skip private properties
            break
          }
          result[schema.properties[prop].name || prop] = transform(value[prop], schema.properties[prop], rootSchema)
        }
        if (schema.additionalProperties) {
          const otherProps = _.difference(Object.getOwnPropertyNames(value), props)
          for (const p of otherProps) {
            result[p] = value[p]
          }
        }
        return result
      } else {
        return value
      }
    } else if (schema.type === 'array') {
      if (!_.isEmpty(schema.items)) {
        const items: any[] = value
        return items.map((item) => transform(item, schema.items, rootSchema))
      } else {
        return value
      }
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

export const importModules = async (workDir: string, config: IModuleLoaderConfig) => {
  const dir = Path.isAbsolute(config.path) ? config.path : Path.resolve(workDir, config.path)
  const files = await fs.readdir(dir)
  const pattern = config.pattern
  const filter = config.filter
  const defaultExcludePattern = /(^\.)|(\.d\.ts$)/
  const defaultIncludePattern = /\.[t|j]s$/
  const modules = [] as any[]
  for (const file of files) {
    const stat = await fs.lstat(Path.resolve(dir, file))
    if (stat.isDirectory()) {
      await importModules(workDir, { path: Path.resolve(dir, file), pattern })
    } else {
      if ((pattern && pattern.exclude && pattern.exclude.test(file)) || defaultExcludePattern.test(file)) {
        break
      }
      if (
        defaultIncludePattern.test(file) &&
        (!pattern || !pattern.include || pattern.include.test(file)) &&
        (!filter || filter(dir, file))
      ) {
        const module = await import(Path.resolve(dir, file))
        modules.push(module)
      }
    }
  }
  return modules
}

export const getFileLoaderConfig = (options: IModuleLoaderOptions) => {
  const path = options.path
  const conf: IModuleLoaderConfig = {
    path
  }
  if (options.pattern) {
    conf.pattern = {}
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
  if (options.filter) {
    conf.filter = options.filter
  }
  return conf
}

export const parseFormData = async (ctx: IRouterContext) => {
  const form = new IncomingForm()
  return new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
    form.parse(ctx.req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      resolve({ fields, files })
    })
  })
}
