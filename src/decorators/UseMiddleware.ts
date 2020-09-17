import { List } from 'immutable'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { Middleware } from '../lib/Middleware'
import { getClassInstance } from '../lib/utils'
import { Constructor } from '../types/Constructor'
import { Authenticator, Guard } from '../processors'
import { IMiddleFilterOptions, MiddlewareFilter } from '../lib/MiddlewareFilter'

export function UseMiddleware(...middleware: (Middleware | Constructor<Middleware>)[]) {
  return (...args: any[]) => {
    middleware = middleware.map((m) => {
      if (typeof m === 'function') {
        return getClassInstance(m)
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

export function FilterMiddleware<T extends Middleware = Middleware>(options: {
  scope?: Constructor<T>
  include?: IMiddleFilterOptions<T>
  exclude?: IMiddleFilterOptions<T>
}) {
  const filter = new MiddlewareFilter(options)
  return (...args: any[]) => {
    if (args.length === 1) {
      const [constructor] = args
      const filters: List<MiddlewareFilter> =
        Reflect.getOwnMetadata(MetadataKey.MIDDLEWARE, constructor.prototype) || List()
      Reflect.defineMetadata(MetadataKey.MIDDLEWARE_FILTER, filters.concat(filter), constructor.prototype)
    } else {
      const [target, propertyKey] = args
      const filters: List<MiddlewareFilter> =
        Reflect.getOwnMetadata(MetadataKey.MIDDLEWARE, target, propertyKey) || List()
      Reflect.defineMetadata(MetadataKey.MIDDLEWARE_FILTER, filters.concat(filter), target, propertyKey)
    }
  }
}

export function UseGuards(...guards: (Guard | Constructor<Guard>)[]) {
  return UseMiddleware(...guards)
}

export function UseGuard(guard: Guard | Constructor<Guard>) {
  return UseMiddleware(guard)
}

export function UseAuthenticator(authenticator: Authenticator) {
  return UseMiddleware(authenticator)
}

export function OnlyAuthenticator(authenticator: Authenticator) {
  UseMiddleware(authenticator)
  FilterMiddleware({ scope: Authenticator, include: { middleware: [authenticator] } })
}

export function NoAuthenticator() {
  FilterMiddleware({ scope: Authenticator, exclude: { type: Authenticator } })
}
