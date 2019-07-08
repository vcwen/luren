import { List } from 'immutable'
import { Context, Middleware as IMiddleware } from 'koa'
import _ from 'lodash'
import 'reflect-metadata'
import { AuthenticationType } from '../constants'
import { MetadataKey } from '../constants/MetadataKey'
import AuthenticationProcessor from '../lib/Authentication'
import { IMiddlewareConditions, INext } from '../types'
export class AuthenticationMetadata {
  public type: AuthenticationType
  public middleware: IMiddleware
  public processor?: AuthenticationProcessor
  constructor(type: AuthenticationType, middleware: IMiddleware, processor?: AuthenticationProcessor) {
    this.type = type
    this.middleware = middleware
    this.processor = processor
  }
}
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

export function Authentication(middleware: AuthenticationProcessor | IMiddleware) {
  const authMetadata: AuthenticationMetadata =
    middleware instanceof AuthenticationProcessor
      ? new AuthenticationMetadata(middleware.type, middleware.toMiddleware(), middleware)
      : new AuthenticationMetadata(AuthenticationType.UNKNOWN, middleware)

  return (...args: any[]) => {
    if (args.length === 1) {
      const [constructor] = args
      Reflect.defineMetadata(MetadataKey.AUTHENTICATION, authMetadata, constructor.prototype)
    } else {
      const [target, propertyKey] = args
      Reflect.defineMetadata(MetadataKey.AUTHENTICATION, authMetadata, target, propertyKey)
    }
  }
}

export const composeConditionalMiddleware = (
  middlewareConditions: IMiddlewareConditions,
  processor: (result: boolean) => Promise<any>
) => {
  return async (ctx: Context, next: INext) => {
    // tslint:disable-next-line: no-empty
    const emptyFunc = async () => {}
    const getResult = async (conditions: IMiddlewareConditions): Promise<boolean> => {
      if (conditions.and) {
        for (const condition of conditions.and) {
          const res = await (typeof condition === 'function' ? condition(ctx, emptyFunc) : getResult(condition))
          if (!res) {
            return false
          }
        }
        return true
      } else {
        for (const condition of conditions.or) {
          const res = await (typeof condition === 'function' ? condition(ctx, emptyFunc) : getResult(condition))
          if (res) {
            return true
          }
        }
        return false
      }
    }
    const result = await getResult(middlewareConditions)
    await processor(result)
    await next()
  }
}

export function Authorization(middleware: IMiddleware) {
  return (...args: any[]) => {
    if (args.length === 1) {
      const [constructor] = args
      const mw: List<IMiddleware> = Reflect.getOwnMetadata(MetadataKey.AUTHORIZATION, constructor.prototype) || List()
      Reflect.defineMetadata(MetadataKey.AUTHORIZATION, mw.concat(middleware), constructor.prototype)
    } else {
      const [target, propertyKey] = args
      const mw: List<IMiddleware> = Reflect.getOwnMetadata(MetadataKey.AUTHORIZATION, target, propertyKey) || List()
      Reflect.defineMetadata(MetadataKey.AUTHORIZATION, mw.concat(middleware), target, propertyKey)
    }
  }
}
