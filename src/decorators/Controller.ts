import decamelize from 'decamelize'
import _ from 'lodash'
import path from 'path'
import nodepath from 'path'
import pluralize from 'pluralize'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import lurenGlobal from '../lib/Global'
import { Constructor } from '../types/Constructor'
import { IRouteMetadata } from './Route'

export interface ICtrlOptions {
  plural?: string
  prefix?: string
  name?: string
  desc?: string
}

export interface ICtrlMetadata {
  name: string
  plural: string
  prefix: string
  path: string
  desc?: string
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

const fixRouteMetadata = (ctrl: Constructor, ctrlMetadata: ICtrlMetadata) => {
  const props = _.keysIn(ctrl.prototype)
  props.forEach((prop) => {
    const routeMetadata: IRouteMetadata = Reflect.getOwnMetadata(MetadataKey.ROUTE, ctrl.prototype, prop)
    if (routeMetadata) {
      routeMetadata.path = nodepath.join(ctrlMetadata.path, routeMetadata.path)
      Reflect.defineMetadata(MetadataKey.ROUTE, routeMetadata, ctrl.prototype, prop)
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
    fixRouteMetadata(constructor, metadata)
  }
}
