import { Constructor } from '../types/Constructor'
import { Middleware } from './Middleware'
import _ from 'lodash'

export interface IMiddleFilterOptions<T extends Middleware = Middleware> {
  type?: Constructor<T>
  middleware?: T[]
  filter?: (middleware: T) => boolean
}
export class MiddlewareFilter<T extends Middleware = Middleware> {
  public target?: Constructor<T>
  public include?: {
    type?: Constructor<T>
    middleware?: (T | Constructor<T>)[]
    filter?: (middleware: T) => boolean
  }
  public exclude?: {
    type?: Constructor<T>
    middleware?: (T | Constructor<T>)[]
    filter?: (middleware: T) => boolean
  }
  constructor(
    options: Partial<{
      target?: Constructor<T>
      include?: IMiddleFilterOptions<T>
      exclude: IMiddleFilterOptions<T>
    }>
  ) {
    this.target = options.target
    this.include = options.include
    this.exclude = options.exclude
    if (!this.include && !this.exclude) {
      throw new Error('Middle must contain at least one condition: include or exclude')
    }
  }
  public filter(middleware: T[]) {
    let intactMiddleware: T[] = []
    const target = this.target
    if (target) {
      intactMiddleware = middleware.filter((item) => !(item instanceof target))
      middleware = middleware.filter((item) => item instanceof target)
    }
    const include = this.include
    if (include) {
      middleware = middleware.filter((item) => {
        if (include.type) {
          if (item instanceof include.type) {
            return true
          }
        }
        if (include.middleware) {
          if (include.middleware.some((m) => m === item)) {
            return true
          }
        }
        if (include.filter) {
          if (include.filter(item)) {
            return true
          }
        }
        return false
      })
    }

    const exclude = this.exclude
    if (exclude) {
      middleware = middleware.filter((item) => {
        if (exclude.type) {
          if (item instanceof exclude.type) {
            return false
          }
        }
        if (exclude.middleware) {
          if (exclude.middleware.some((m) => m === item)) {
            return false
          }
        }
        if (exclude.filter) {
          if (exclude.filter(item)) {
            return false
          }
        }
        return true
      })
    }

    if (!_.isEmpty(intactMiddleware)) {
      return middleware.concat(intactMiddleware)
    } else {
      return middleware
    }
  }
}
