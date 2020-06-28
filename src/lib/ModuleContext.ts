import { Luren } from '../Luren'
import { ActionModule } from './Action'
import { ControllerModule } from './Controller'
export class ModuleContext {
  constructor(public app: Luren, public controllerModule?: ControllerModule, public actionModule?: ActionModule) {}
}
