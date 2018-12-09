import _ from 'lodash'
import 'reflect-metadata'
import { struct } from 'superstruct'
import { MetadataKey } from '../constants/MetadataKey'
import { IModelMetadata } from '../decorators/Model'

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
    const modelMetadata: IModelMetadata = Reflect.getMetadata(MetadataKey.MODEL, schema)
    if (modelMetadata) {
      return [{ $ref: `#/models/${modelMetadata.name}` }, false]
    } else {
      throw new TypeError('Invalid schema:' + schema)
    }
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

export const jsonSchemaToStructSchema = (schema: IJsonSchema, required: boolean = false) => {
  let structSchema: any = {}
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
          structSchema[prop] = jsonSchemaToStructSchema(schemaDetail[prop], requiredProps.includes(prop))
        }
      }
      structSchema = struct.partial(structSchema)
    } else {
      structSchema = 'object'
    }
  }
  if (required) {
    return struct(structSchema)
  } else {
    return struct.optional(structSchema)
  }
}
