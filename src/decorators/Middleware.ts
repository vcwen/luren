import { List } from 'immutable'
import { IMiddleware } from 'koa-router'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'

export function Middleware(...middleware: IMiddleware[]) {
  return (...args: any[]) => {
    if (args.length === 1) {
      const [constructor] = args
      const mw: List<IMiddleware> = Reflect.getOwnMetadata(MetadataKey.MIDDLEWARE, constructor.prototype) || List()
      Reflect.defineMetadata(MetadataKey.MIDDLEWARE, mw.concat(middleware), constructor.prototype)
    } else {
      const [target, propertyKey] = args
      const mw: List<IMiddleware> = Reflect.getOwnMetadata(MetadataKey.MIDDLEWARE, target, propertyKey) || List()
      Reflect.defineMetadata(MetadataKey.MIDDLEWARE, mw.concat(middleware), target, propertyKey)
    }
  }
}
