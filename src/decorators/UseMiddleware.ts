import { List } from 'immutable'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { Middleware } from '../lib/Middleware'
import { getClassInstance } from '../lib/utils'
import { Constructor } from '../types/Constructor'
import { Guard } from '../processors'
import { ModuleContext } from '../lib'
import { MiddlewarePack } from '../lib/MiddlewarePack'
export interface IUseMiddlewareOptions {
  shouldMount?: (moduleContext: ModuleContext) => boolean
  filter?: (middleware: Middleware) => boolean
  isPlaceholder?: boolean
}
export function UseMiddleware(
  middleware: (Middleware | Constructor<Middleware>) | (Middleware | Constructor<Middleware>)[],
  options?: IUseMiddlewareOptions
) {
  return (...args: any[]) => {
    if (!Array.isArray(middleware)) {
      middleware = [middleware]
    }
    middleware = middleware.map((m) => {
      if (typeof m === 'function') {
        return getClassInstance(m)
      } else if (m instanceof Middleware) {
        return m
      } else {
        throw TypeError('Invalid middleware type')
      }
    })
    const middlewarePacks = List(middleware.map((m) => new MiddlewarePack(m as Middleware, options)))
    if (args.length === 1) {
      const [constructor] = args
      const mwPacks: List<MiddlewarePack> =
        Reflect.getOwnMetadata(MetadataKey.MIDDLEWARE_PACKS, constructor.prototype) || List()
      Reflect.defineMetadata(MetadataKey.MIDDLEWARE_PACKS, middlewarePacks.concat(mwPacks), constructor.prototype)
    } else {
      const [target, propertyKey] = args
      const mwPacks: List<MiddlewarePack> =
        Reflect.getOwnMetadata(MetadataKey.MIDDLEWARE_PACKS, target, propertyKey) || List()
      Reflect.defineMetadata(MetadataKey.MIDDLEWARE_PACKS, middlewarePacks.concat(mwPacks), target, propertyKey)
    }
  }
}

export function UseGuard(
  guard: Guard | Constructor<Guard> | (Guard | Constructor<Guard>)[],
  options?: IUseMiddlewareOptions
) {
  return UseMiddleware(guard, options)
}

export function FilterMiddleware(filter: (m: Middleware) => boolean, type: string)
export function FilterMiddleware(filter: (m: Middleware) => boolean, placeholder?: Middleware)
export function FilterMiddleware(filter: (m: Middleware) => boolean, option: any) {
  let m: Middleware
  if (typeof option === 'string') {
    const type = option
    m = new (class extends Middleware {
      public type = type
      // tslint:disable-next-line: no-empty
      public async execute() {}
    })()
  } else if (option instanceof Middleware) {
    m = option
  } else {
    throw new Error('the option should be a type string or middleware placeholder object')
  }
  return UseMiddleware(m, { filter, isPlaceholder: true })
}
