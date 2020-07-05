import { List } from 'immutable'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { Middleware } from '../lib/Middleware'
import { getClassInstance } from '../lib/utils'
import Router from '@koa/router'
import { Constructor } from '../types/Constructor'

export function UseMiddleware(...middleware: (Middleware | Constructor<Middleware> | Router.Middleware)[]) {
  return (...args: any[]) => {
    middleware = middleware.map((m) => {
      if (typeof m === 'function') {
        if (Middleware.isPrototypeOf(m)) {
          return getClassInstance<Middleware>(m as any)
        } else {
          return m
        }
      } else if (m instanceof Middleware) {
        return m
      } else {
        throw TypeError('Invalid middleware type')
      }
    })
    const newMiddleware = List(middleware)
    if (args.length === 1) {
      const [constructor] = args
      const mw: List<any> = Reflect.getOwnMetadata(MetadataKey.MIDDLEWARE, constructor.prototype) || List()
      Reflect.defineMetadata(MetadataKey.MIDDLEWARE, newMiddleware.concat(mw), constructor.prototype)
    } else {
      const [target, propertyKey] = args
      const mw: List<any> = Reflect.getOwnMetadata(MetadataKey.MIDDLEWARE, target, propertyKey) || List()
      Reflect.defineMetadata(MetadataKey.MIDDLEWARE, newMiddleware.concat(mw), target, propertyKey)
    }
  }
}
