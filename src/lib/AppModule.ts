import { List } from 'immutable'
import { Luren } from '../Luren'
import { ControllerModule } from '.'
import { MiddlewarePack } from './MiddlewarePack'

export class AppModule {
  public app: Luren
  public middlewarePacks: List<MiddlewarePack> = List()
  public controllerModules: List<ControllerModule> = List()
  constructor(app: Luren) {
    this.app = app
  }
}
