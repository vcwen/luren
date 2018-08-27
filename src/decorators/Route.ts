import { clone, defaults } from 'lodash'
import 'reflect-metadata'
import { HttpMethod } from '../constants/HttpMethod'
import { MetadataKey } from '../constants/MetadataKey'
import { PropertyDecorator } from '../types/PropertyDecorator'

export interface IRouteOptions {
  private?: boolean
  name?: string
  path?: string
  method?: HttpMethod
  desc?: string
}

export interface IRouteMetadata {
  private: boolean
  name: string
  path: string
  method: HttpMethod
  desc?: string
}

const getRouteMetadata = (options: any, _: object, propertyKey: string) => {
  const metadata = clone(options)
  defaults(metadata, { method: HttpMethod.GET, name: propertyKey, path: '/' + propertyKey, private: false })
  return metadata
}

export function Route(options?: IRouteOptions): PropertyDecorator {
  return (target: object, propertyKey: string) => {
    if (options) {
      const metadata = getRouteMetadata(options, target, propertyKey)
      Reflect.defineMetadata(MetadataKey.ROUTE, metadata, target, propertyKey)
    } else {
      const metadata = getRouteMetadata({}, target, propertyKey)
      Reflect.defineMetadata(MetadataKey.ROUTE, metadata, target, propertyKey)
    }
  }
}

function methodifyRouteDecorator(method: HttpMethod) {
  return (options?: IRouteOptions): PropertyDecorator => {
    return (target: object, propertyKey: string) => {
      if (options) {
        options.method = method
        const metadata = getRouteMetadata(options, target, propertyKey)
        Reflect.defineMetadata(MetadataKey.ROUTE, metadata, target, propertyKey)
      } else {
        const metadata = getRouteMetadata({ method }, target, propertyKey)
        Reflect.defineMetadata(MetadataKey.ROUTE, metadata, target, propertyKey)
      }
    }
  }
}

export function Get(options?: IRouteOptions): PropertyDecorator {
  return methodifyRouteDecorator(HttpMethod.GET)(options)
}

export function Post(options?: IRouteOptions) {
  return methodifyRouteDecorator(HttpMethod.POST)(options)
}

export function Put(options?: IRouteOptions): PropertyDecorator {
  return methodifyRouteDecorator(HttpMethod.PUT)(options)
}

export function Patch(options?: IRouteOptions): PropertyDecorator {
  return methodifyRouteDecorator(HttpMethod.PATCH)(options)
}

export function Delete(options?: IRouteOptions): PropertyDecorator {
  return methodifyRouteDecorator(HttpMethod.DELETE)(options)
}
