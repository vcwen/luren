import _ from 'lodash'
import { struct } from 'superstruct'

export interface IJsonSchema {
  title?: string
  type: string
  format?: string
  properties?: { [prop: string]: IJsonSchema }
  items?: IJsonSchema
  required?: string[]
  description?: string
}

const normalizeType = (type: string): [string, boolean] => {
  const regex = /(\w+?)(\?)?$/
  const match = regex.exec(type)
  if (match) {
    const prop = match[1]
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
    if (match[2]) {
      return [prop, false]
    } else {
      return [prop, true]
    }
  } else {
    throw new Error('Invalid prop:' + decoratedProp)
  }
}

const _convertSchemaToJsonSchema = (schema: any): [any, boolean] => {
  if (typeof schema === 'string') {
    const [type, required] = normalizeType(schema)
    return [{ type }, required]
  } else if (Array.isArray(schema)) {
    const propSchema: any = { type: 'array' }
    if (schema.length > 0 && schema[0]) {
      const itemSchema = _convertSchemaToJsonSchema(schema[0])
      propSchema.items = itemSchema
    }
    return propSchema
  } else if (typeof schema === 'object') {
    const jsonSchema: IJsonSchema = { type: 'object', properties: {} }
    const requiredProps = [] as string[]
    for (const prop in schema) {
      if (schema.hasOwnProperty(prop)) {
        const [propSchema, propRequired] = _convertSchemaToJsonSchema(schema[prop])
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
  } else {
    throw new TypeError('Invalid schema:' + schema)
  }
}

export const convertSchemaToJsonSchema = (schema: any) => {
  const [jsonSchema] = _convertSchemaToJsonSchema(schema)
  return jsonSchema
}

export const normalizeSchema = (schema: any): IJsonSchema => {
  if (_.isEmpty(schema)) {
    throw new Error('Invalid schema.')
  }
  if (schema.type === 'object' && schema.properties) {
    return _.cloneDeep(schema)
  } else {
    return convertSchemaToJsonSchema(schema)
  }
}

const isPrimitiveType = (type: string) => {
  if (type === 'object' || type === 'array') {
    return false
  } else {
    return true
  }
}

export const structSchemaFromJsonSchema = (schema: IJsonSchema, required: boolean = false) => {
  let structSchema: any = {}
  if (isPrimitiveType(schema.type)) {
    structSchema = schema.type
  } else if (schema.type === 'array') {
    if (schema.items && !_.isEmpty(schema.items)) {
      structSchema = struct.list([structSchemaFromJsonSchema(schema.items)])
    } else {
      structSchema = 'array'
    }
  } else {
    if (schema.properties) {
      const schemaDetail = schema.properties
      const requiredProps = schema.required || ([] as string[])
      for (const prop in schemaDetail) {
        if (schemaDetail.hasOwnProperty(prop)) {
          structSchema[prop] = structSchemaFromJsonSchema(schemaDetail[prop], requiredProps.includes(prop))
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
