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
  defaults(metadata, { method: HttpMethod.GET, name: propertyKey, path: propertyKey, private: false })
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

interface IMethodifyOptions {
  private?: boolean
  name?: string
  path?: string
  desc?: string
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

export function Get(options: IMethodifyOptions): PropertyDecorator
export function Get(target: object, propertyKey: string): void
export function Get() {
  return methodifyRouteDecorator(HttpMethod.GET).apply(null, arguments)
}

export function Post(options: IMethodifyOptions): PropertyDecorator
export function Post(target: object, propertyKey: string): void
export function Post() {
  return methodifyRouteDecorator(HttpMethod.POST).apply(null, arguments)
}

export function Put(options: IMethodifyOptions): PropertyDecorator
export function Put(target: object, propertyKey: string): void
export function Put() {
  return methodifyRouteDecorator(HttpMethod.PUT).apply(null, arguments)
}

export function Patch(options: IMethodifyOptions): PropertyDecorator
export function Patch(target: object, propertyKey: string): void
export function Patch() {
  return methodifyRouteDecorator(HttpMethod.PATCH).apply(null, arguments)
}
export function Delete(options: IMethodifyOptions): PropertyDecorator
export function Delete(target: object, propertyKey: string): void
export function Delete() {
  return methodifyRouteDecorator(HttpMethod.DELETE).apply(null, arguments)
}
