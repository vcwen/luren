import { ActionModule } from './Action'
import { ControllerModule } from './ControllerModule'
import { AppModule } from './AppModule'
export class ModuleContext {
  constructor(
    public appModule: AppModule,
    public controllerModule?: ControllerModule,
    public actionModule?: ActionModule
  ) {}
}
