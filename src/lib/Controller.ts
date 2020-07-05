import { List, Map } from 'immutable'
import { ActionModule } from './Action'
import { Middleware } from './Middleware'
import { Middleware as KoaMiddleware } from 'koa'
import { GuardGroup } from '../processors/Guard'

export class ControllerModule {
  public controller: object
  public actionModules: List<ActionModule> = List()
  public middleware: List<Middleware | KoaMiddleware> = List()
  public guards: Map<string, GuardGroup> = Map()
  public name!: string
  public plural?: string
  public prefix: string = ''
  public path!: string
  public version?: string
  public desc?: string
  constructor(ctrl: object) {
    this.controller = ctrl
  }
}
