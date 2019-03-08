import { Map } from 'immutable'
import { IMiddleware } from 'koa-router'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { Phase } from '../constants/Middleware'

export function PreController(...middleware: IMiddleware[]) {
  return (constructor: any) => {
    const mw: Map<string, any> = Reflect.getOwnMetadata(MetadataKey.MIDDLEWARE, constructor) || Map()
    Reflect.defineMetadata(MetadataKey.MIDDLEWARE, mw.set(Phase.PRE, middleware), constructor)
  }
}

export function PostController(...middleware: IMiddleware[]) {
  return (constructor: any) => {
    const mw: Map<string, any> = Reflect.getOwnMetadata(MetadataKey.MIDDLEWARE, constructor) || Map()
    Reflect.defineMetadata(MetadataKey.MIDDLEWARE, mw.set(Phase.POST, middleware), constructor)
  }
}

export function PreRoute(...middleware: IMiddleware[]) {
  return (target: object, propertyKey: string) => {
    const mw: Map<string, any> = Reflect.getOwnMetadata(MetadataKey.MIDDLEWARE, target, propertyKey) || Map()
    Reflect.defineMetadata(MetadataKey.MIDDLEWARE, mw.set(Phase.PRE, middleware), target, propertyKey)
  }
}

export function PostRoute(...middleware: IMiddleware[]) {
  return (target: object, propertyKey: string) => {
    const mw: Map<string, any> = Reflect.getOwnMetadata(MetadataKey.MIDDLEWARE, target, propertyKey) || Map()
    Reflect.defineMetadata(MetadataKey.MIDDLEWARE, mw.set(Phase.POST, middleware), target, propertyKey)
  }
}
