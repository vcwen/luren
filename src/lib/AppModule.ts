import { List } from 'immutable'
import { Luren } from '../Luren'
import { ControllerModule } from '.'
import { Middleware } from './Middleware'

export class AppModule {
  public app: Luren
  public middleware: List<Middleware> = List()
  public controllerModules: List<ControllerModule> = List()
  constructor(app: Luren) {
    this.app = app
  }
}
