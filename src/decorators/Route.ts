import { Map } from 'immutable'
import 'reflect-metadata'
import { HttpMethod } from '../constants/HttpMethod'
import { MetadataKey } from '../constants/MetadataKey'
import { PropertyDecorator } from '../types/PropertyDecorator'

export interface IRouteOptions {
  name?: string
  path?: string
  method?: HttpMethod
  version?: string
  deprecated?: boolean
  desc?: string
}

export class RouteMetadata {
  public name: string
  public path: string
  public method: HttpMethod
  public deprecated: boolean = false
  public version?: string
  public desc?: string
  constructor(name: string, method: HttpMethod, path: string, version?: string, desc?: string) {
    this.name = name
    this.method = method
    this.path = path
    this.version = version
    this.desc = desc
  }
}

const getRouteMetadata = (options: IRouteOptions, _: object, propertyKey: string) => {
  const name = options.name || propertyKey
  const method = options.method || HttpMethod.GET
  const path = options.path || '/' + propertyKey
  const metadata = new RouteMetadata(name, method, path, options.version, options.desc)
  return metadata
}

export function Route(options: IRouteOptions = {}): PropertyDecorator {
  return (target: object, propertyKey: string) => {
    const metadata = getRouteMetadata(options, target, propertyKey)
    let routeMetadataMap: Map<string, RouteMetadata> = Reflect.getMetadata(MetadataKey.ROUTES, target) || Map()
    routeMetadataMap = routeMetadataMap.set(propertyKey, metadata)
    Reflect.defineMetadata(MetadataKey.ROUTES, routeMetadataMap, target)
  }
}

function methodifyRouteDecorator(method: HttpMethod) {
  return (options: IRouteOptions = {}): PropertyDecorator => {
    return (target: object, propertyKey: string) => {
      options.method = method
      const metadata = getRouteMetadata(options, target, propertyKey)
      let routeMetadataMap: Map<string, RouteMetadata> = Reflect.getMetadata(MetadataKey.ROUTES, target) || Map()
      routeMetadataMap = routeMetadataMap.set(propertyKey, metadata)
      Reflect.defineMetadata(MetadataKey.ROUTES, routeMetadataMap, target)
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
