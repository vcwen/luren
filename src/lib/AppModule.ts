import { List, Map } from 'immutable'
import { Luren } from '../Luren'
import { ControllerModule } from '.'
import { GuardGroup } from '../processors/Guard'

export class AppModule {
  public app: Luren
  public guards: Map<string, GuardGroup> = Map()
  public controllerModules: List<ControllerModule> = List()
  constructor(app: Luren) {
    this.app = app
  }
}
