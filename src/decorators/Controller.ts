import decamelize from 'decamelize'
import _ from 'lodash'
import Path from 'path'
import pluralize from 'pluralize'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { Constructor } from '../types/Constructor'

export interface ICtrlOptions {
  version?: string
  path?: string
  plural?: string
  prefix?: string
  name?: string
  desc?: string
}

export class CtrlMetadata {
  public name: string
  public plural?: string
  public prefix: string = ''
  public path: string
  public version?: string
  public desc?: string
  constructor(name: string, path: string, version?: string, desc?: string) {
    this.name = name
    this.path = path
    this.version = version
    this.desc = desc
  }
}

export const getCtrlMetadata = (options: ICtrlOptions, constructor: Constructor<any>) => {
  const name = options.name || constructor.name.split(/controller$/i)[0]
  const prefix = options.prefix || ''
  const plural = options.plural || pluralize.plural(decamelize(name, '-'))
  const path = options.path || Path.join('/', plural)
  const metadata = new CtrlMetadata(name, path, options.version, options.desc)
  metadata.prefix = prefix
  return metadata
}

export function Controller(options: ICtrlOptions = {}) {
  return <T>(constructor: Constructor<T>) => {
    const metadata = getCtrlMetadata(options, constructor)
    Reflect.defineMetadata(MetadataKey.CONTROLLER, metadata, constructor.prototype)
  }
}
