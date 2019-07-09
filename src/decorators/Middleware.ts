import { List } from 'immutable'
import { Context, Middleware as IMiddleware } from 'koa'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import AuthenticationProcessor, { NoneAuthentication } from '../lib/Authentication'
import AuthorizationProcessor from '../lib/Authorization'
import Processor from '../lib/Processor'
import { adaptMiddleware } from '../lib/utils'
import { INext, IProcessorConditions } from '../types'

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

export function NoAuthentication() {
  const processor = new NoneAuthentication()
  return (...args: any[]) => {
    if (args.length === 1) {
      const [constructor] = args
      Reflect.defineMetadata(MetadataKey.AUTHENTICATION, processor, constructor.prototype)
    } else {
      const [target, propertyKey] = args
      Reflect.defineMetadata(MetadataKey.AUTHENTICATION, processor, target, propertyKey)
    }
  }
}

export function Authentication(processor: AuthenticationProcessor) {
  return (...args: any[]) => {
    if (args.length === 1) {
      const [constructor] = args
      Reflect.defineMetadata(MetadataKey.AUTHENTICATION, processor, constructor.prototype)
    } else {
      const [target, propertyKey] = args
      Reflect.defineMetadata(MetadataKey.AUTHENTICATION, processor, target, propertyKey)
    }
  }
}

export const composeConditionalProcessor = (
  processorConditions: IProcessorConditions,
  resultHandler: (result: boolean) => Promise<any>
) => {
  return async (ctx: Context, next: INext) => {
    // tslint:disable-next-line: no-empty
    const emptyFunc = async () => {}
    const getResult = async (conditions: IProcessorConditions): Promise<boolean> => {
      if (conditions.and) {
        for (const condition of conditions.and) {
          const res = await (condition instanceof Processor
            ? adaptMiddleware(condition)(ctx, emptyFunc)
            : getResult(condition))
          if (!res) {
            return false
          }
        }
        return true
      } else {
        for (const condition of conditions.or) {
          const res = await (condition instanceof Processor
            ? adaptMiddleware(condition)(ctx, emptyFunc)
            : getResult(condition))
          if (res) {
            return true
          }
        }
        return false
      }
    }
    const result = await getResult(processorConditions)
    await resultHandler(result)
    await next()
  }
}

export function Authorization(processor: AuthorizationProcessor) {
  return (...args: any[]) => {
    if (args.length === 1) {
      const [constructor] = args
      Reflect.defineMetadata(MetadataKey.AUTHORIZATION, processor, constructor.prototype)
    } else {
      const [target, propertyKey] = args
      Reflect.defineMetadata(MetadataKey.AUTHORIZATION, processor, target, propertyKey)
    }
  }
}
