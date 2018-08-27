import decamelize from 'decamelize'
import { List, Map } from 'immutable'
import _ from 'lodash'
import path from 'path'
import pluralize from 'pluralize'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import lurenGlobal from '../lib/Global'
import { normalizeSchema } from '../lib/utils'
import { Constructor } from '../types/Constructor'
import { IResultMetadata } from './Result'

export interface ICtrlOptions {
  plural?: string
  prefix?: string
  name?: string
  generic?: { [key: string]: any }
  desc?: string
}

export interface ICtrlMetadata {
  name: string
  plural: string
  prefix: string
  path: string
  desc?: string
  generic?: { [key: string]: any }
}

const getCtrlMetadata = (options: ICtrlOptions, constructor: Constructor) => {
  const metadata: ICtrlMetadata = _.clone(options) as any
  _.defaults(metadata, {
    name: constructor.name.split(/controller$/i)[0],
    prefix: ''
  })
  if (!metadata.plural) {
    metadata.plural = pluralize.plural(decamelize(metadata.name, '-'))
  }
  metadata.path = path.join('/', metadata.prefix, metadata.plural)
  return metadata
}

const fixResultMetadata = (ctrl: Constructor, genericMap: Map<string, any>) => {
  const props = Object.getOwnPropertyNames(Reflect.getPrototypeOf(ctrl)).filter((prop) => prop !== 'constructor')

  props.forEach((prop) => {
    const resultMetadataList: List<IResultMetadata> = Reflect.getOwnMetadata(MetadataKey.RESULT, ctrl.prototype, prop)
    if (resultMetadataList) {
      const resultMetadata = resultMetadataList.find((value) => !!value.isGeneric)
      if (resultMetadata && resultMetadata.isGeneric) {
        resultMetadata.schema = normalizeSchema(resultMetadata.rawSchema, genericMap)
      }
    }
  })
}

export function Controller(options?: ICtrlOptions) {
  return (constructor: Constructor) => {
    lurenGlobal.registerController(constructor)
    let metadata: ICtrlMetadata
    if (options) {
      metadata = getCtrlMetadata(options, constructor)
    } else {
      metadata = getCtrlMetadata({}, constructor)
    }
    Reflect.defineMetadata(MetadataKey.CONTROLLER, metadata, constructor)
    if (metadata.generic) {
      fixResultMetadata(constructor, Map(metadata.generic))
    }
  }
}
