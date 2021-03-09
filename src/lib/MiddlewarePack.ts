import { Middleware } from './Middleware'
import { ModuleContext } from './ModuleContext'

export class MiddlewarePack {
  public middleware: Middleware
  public filter?: (middleware: Middleware) => boolean
  public shouldMount?: (moduleContext: ModuleContext) => boolean
  public isPlaceholder: boolean = false
  constructor(
    middleware: Middleware,
    options?: {
      filter?: (middleware: Middleware) => boolean
      shouldMount?: (moduleContext: ModuleContext) => boolean
      isPlaceholder?: boolean
    }
  ) {
    this.middleware = middleware
    if (options?.filter) {
      this.filter = options.filter
    }
    if (options?.shouldMount) {
      this.shouldMount = options.shouldMount
    }
    if (options?.isPlaceholder) {
      this.isPlaceholder = true
    }
  }
}
