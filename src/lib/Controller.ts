import { List } from 'immutable'
import { Luren } from '../Luren'
import Action from './Action'
import { IKoaMiddleware, IMiddleware } from './Middleware'

export default class Controller {
  public actions: List<Action> = List()
  public middleware: List<IMiddleware | IKoaMiddleware> = List()
  public luren: Luren
  public name!: string
  public plural?: string
  public prefix: string = ''
  public path!: string
  public version?: string
  public desc?: string
  constructor(luren: Luren) {
    this.luren = luren
  }
}
