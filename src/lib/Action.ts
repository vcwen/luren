import { List, Map } from 'immutable'
import { Middleware } from 'koa'
import { HttpMethod } from '../constants'
import { Luren } from '../Luren'
import { IProcess, ISecuritySettings } from '../types'
export default class Action {
  public name!: string
  public path: string
  public method: HttpMethod
  public middleware: List<Middleware> = List()
  public process: IProcess
  public luren: Luren
  public deprecated: boolean = false
  public version?: string
  public responses: Map<number, any> = Map()
  public securitySettings: ISecuritySettings = {}
  public desc?: string
  constructor(luren: Luren, method: HttpMethod, path: string, process: IProcess) {
    this.luren = luren
    this.method = method
    this.path = path
    this.process = process
  }
}
