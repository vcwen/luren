import decamelize from 'decamelize'
import { injectable } from 'inversify'
import _ from 'lodash'
import Path from 'path'
import pluralize from 'pluralize'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { registerController } from '../lib/global'
import { Constructor } from '../types/Constructor'

export interface ICtrlOptions {
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
  public desc?: string
  constructor(name: string, path: string, desc?: string) {
    this.name = name
    this.path = path
    this.desc = desc
  }
}

const getCtrlMetadata = (options: ICtrlOptions, constructor: Constructor) => {
  const name = options.name || constructor.name.split(/controller$/i)[0]
  const prefix = options.prefix || ''
  const plural = options.plural || pluralize.plural(decamelize(name, '-'))
  const path = options.path || Path.join('/', prefix, plural)
  const metadata = new CtrlMetadata(name, path, options.desc)
  return metadata
}

export function Controller(options: ICtrlOptions = {}) {
  return (constructor: Constructor) => {
    injectable()(constructor)
    registerController(constructor)
    const metadata = getCtrlMetadata(options, constructor)
    Reflect.defineMetadata(MetadataKey.CONTROLLER, metadata, constructor)
  }
}
