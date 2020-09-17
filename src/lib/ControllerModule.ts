import { List } from 'immutable'
import { ActionModule } from './Action'
import { Middleware } from './Middleware'
import Path from 'path'
import { CtrlMetadata } from '../decorators'
import { MetadataKey } from '../constants'
import { pathToRegexp } from 'path-to-regexp'
import { MiddlewareFilter } from './MiddlewareFilter'
import { AppModule } from './AppModule'

export class ControllerModule {
  appModule: AppModule
  public controller: object
  public actionModules: List<ActionModule> = List()
  public middleware: List<Middleware> = List()
  public name: string
  public plural?: string
  public prefix: string = ''
  public path: string
  public version?: string
  public pathRegExp: RegExp
  public desc?: string
  constructor(appModule: AppModule, ctrl: object) {
    this.appModule = appModule
    this.controller = ctrl
    const ctrlMetadata: CtrlMetadata | undefined = Reflect.getMetadata(MetadataKey.CONTROLLER, ctrl)
    if (!ctrlMetadata) {
      throw new TypeError('invalid controller instance')
    }
    this.name = ctrlMetadata.name
    this.plural = ctrlMetadata.plural
    this.prefix = ctrlMetadata.prefix ?? ''
    this.path = ctrlMetadata.path
    this.version = ctrlMetadata.version
    this.pathRegExp = pathToRegexp(this.getFullPath(), [], {
      end: false
    })
    this.desc = ctrlMetadata.desc
    const middleware: List<Middleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, ctrl) || List()
    const middlewareFilters: List<MiddlewareFilter> = Reflect.getMetadata(MetadataKey.MIDDLEWARE_FILTER, ctrl) || List()
    const filteredMiddleware = middlewareFilters.reduce(
      (mw, filter) => filter.filter(mw),
      this.appModule.middleware.concat(middleware).toArray()
    )
    this.middleware = List(filteredMiddleware)
  }
  public getFullPath() {
    return Path.join(this.prefix, this.version ?? '', this.path)
  }
}
