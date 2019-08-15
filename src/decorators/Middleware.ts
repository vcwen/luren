import { List } from 'immutable'
import { Context, Middleware as IMiddleware } from 'koa'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import AuthenticationProcessor, { NoneAuthentication } from '../lib/Authentication'
import AuthorizationProcessor from '../lib/Authorization'
import { getParams } from '../lib/helper'
import Processor from '../lib/Processor'
import { INext, IProcessorConditions } from '../types'
import { ParamMetadata } from './Param'

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

export const composeConditionalProcessors = <T extends Processor<boolean>>(
  processorConditions: IProcessorConditions,
  handler: (process: (ctx: Context, next: INext) => Promise<boolean>) => T
): T => {
  const process = async (ctx: Context, next: INext): Promise<boolean> => {
    let nextCalled = false
    const originNext = next
    next = async () => {
      if (nextCalled) {
        return
      } else {
        nextCalled = true
        return originNext()
      }
    }
    const getProcessorResult = async (processor: Processor<boolean>) => {
      const paramsMetadata: List<ParamMetadata> =
        Reflect.getMetadata(MetadataKey.PARAMS, processor, 'process') || List()
      if (paramsMetadata.isEmpty()) {
        return processor.process(ctx, next)
      } else {
        const args = getParams(ctx, next, paramsMetadata)
        return processor.process(...args)
      }
    }
    const getResult = async (conditions: IProcessorConditions<T>): Promise<boolean> => {
      if (conditions.and) {
        for (const condition of conditions.and) {
          const res = await (condition instanceof Processor ? getProcessorResult(condition) : getResult(condition))
          if (!res) {
            return false
          }
        }
        return true
      } else if (conditions.or) {
        for (const condition of conditions.or) {
          const res = await (condition instanceof Processor ? getProcessorResult(condition) : getResult(condition))
          if (res) {
            return true
          }
        }
        return false
      } else {
        return true
      }
    }
    return getResult(processorConditions)
  }
  return handler(process)
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
