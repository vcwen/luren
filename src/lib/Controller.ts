import { List } from 'immutable'
import { Middleware } from 'koa'
import { Luren } from '../Luren'
import { ISecuritySettings } from '../types'
import Action from './Action'

export default class Controller {
  public actions: List<Action> = List()
  public middleware: List<Middleware> = List()
  public luren: Luren
  public name!: string
  public plural?: string
  public prefix: string = ''
  public path!: string
  public version?: string
  public securitySettings: ISecuritySettings = {}
  public desc?: string
  constructor(luren: Luren) {
    this.luren = luren
  }
}
