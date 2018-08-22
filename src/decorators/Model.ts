import { Map } from 'immutable'
import 'reflect-metadata'
import MetadataKey from '../constants/MetadataKey'
import { Constructor } from '../types/Constructor'

export interface IModelOptions {
  name?: string
  desc?: string
}

export interface IModelMetadata {
  name: string
  desc?: string
}

export interface IPropOptions {
  name?: string
  type: string
  desc?: string
}

export interface IPropMetadata {
  name: string
  type: string
  desc?: string
}

export function Model(options?: IModelOptions) {
  return (constructor: Constructor) => {
    if (options) {
      const modelMetadata = options as IModelMetadata
      Reflect.defineMetadata(MetadataKey.MODEL, modelMetadata, constructor)
    } else {
      const modelConf = { name: constructor.name } as IModelMetadata
      Reflect.defineMetadata(MetadataKey.MODEL, modelConf, constructor)
    }
  }
}

export function Prop(options?: IPropOptions) {
  return (target: object, propertyKey: string) => {
    if (options) {
      let propsMetadata: Map<string, IPropMetadata> = Reflect.getMetadata(MetadataKey.PROP, target.constructor) || Map()
      const name = options.name ? options.name : propertyKey
      propsMetadata = propsMetadata.set(name, { name, type: options.type, desc: options.desc })
      Reflect.defineMetadata(MetadataKey.PROP, propsMetadata, target.constructor)
    } else {
      let propsMetadata: Map<string, IPropMetadata> = Reflect.getMetadata(MetadataKey.PROP, target.constructor) || Map()
      propsMetadata = propsMetadata.set(propertyKey, { name: propertyKey, type: 'string' })
      Reflect.defineMetadata(MetadataKey.PROP, propsMetadata, target.constructor)
    }
  }
}
