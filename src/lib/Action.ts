import { List } from 'immutable'
import { HttpMethod } from '../constants'
import { Luren } from '../Luren'
import { IProcess } from '../types'
import { IKoaMiddleware, IMiddleware } from './Middleware'
export default class Action {
  public name!: string
  public path: string
  public method: HttpMethod
  public middleware: List<IMiddleware | IKoaMiddleware> = List()
  public process: IProcess
  public luren: Luren

  public deprecated: boolean = false
  public version?: string
  public desc?: string
  constructor(luren: Luren, method: HttpMethod, path: string, process: IProcess) {
    this.luren = luren
    this.method = method
    this.path = path
    this.process = process
  }
}
