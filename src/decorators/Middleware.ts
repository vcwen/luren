import { Map } from 'immutable'
import { IMiddleware } from 'koa-router'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { Phase } from '../constants/Middleware'

export function PreController(...middlewares: IMiddleware[]) {
  return (constructor: any) => {
    const mws: Map<string, any> = Reflect.getOwnMetadata(MetadataKey.MIDDLEWARES, constructor) || Map()
    Reflect.defineMetadata(MetadataKey.MIDDLEWARES, mws.set(Phase.PRE, middlewares), constructor)
  }
}

export function PostController(...middlewares: IMiddleware[]) {
  return (constructor: any) => {
    const mws: Map<string, any> = Reflect.getOwnMetadata(MetadataKey.MIDDLEWARES, constructor) || Map()
    Reflect.defineMetadata(MetadataKey.MIDDLEWARES, mws.set(Phase.POST, middlewares), constructor)
  }
}

export function PreRoute(...middlewares: IMiddleware[]) {
  return (target: object, propertyKey: string) => {
    const mws: Map<string, any> = Reflect.getOwnMetadata(MetadataKey.MIDDLEWARES, target, propertyKey) || Map()
    Reflect.defineMetadata(MetadataKey.MIDDLEWARES, mws.set(Phase.PRE, middlewares), target, propertyKey)
  }
}

export function PostRoute(...middlewares: IMiddleware[]) {
  return (target: object, propertyKey: string) => {
    const mws: Map<string, any> = Reflect.getOwnMetadata(MetadataKey.MIDDLEWARES, target, propertyKey) || Map()
    Reflect.defineMetadata(MetadataKey.MIDDLEWARES, mws.set(Phase.POST, middlewares), target, propertyKey)
  }
}
