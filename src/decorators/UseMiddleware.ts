import { List } from 'immutable'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { IMiddleware, Middleware as LurenMiddleware, Middleware } from '../lib/Middleware'
import { getClassInstance } from '../lib/utils'
import Router from '@koa/router'

export function UseMiddleware(...middleware: (IMiddleware | Router.Middleware)[]) {
  return (...args: any[]) => {
    middleware = middleware.map((m) => {
      if (typeof m === 'function') {
        if (LurenMiddleware.isPrototypeOf(m)) {
          return getClassInstance<LurenMiddleware>(m as any)
        } else {
          return m
        }
      } else if (m instanceof Middleware) {
        return m
      } else {
        throw TypeError('Invalid middleware type')
      }
    })
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
