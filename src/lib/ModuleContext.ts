import { ActionModule } from './Action'
import { ControllerModule } from './Controller'
import { AppModule } from './AppModule'
export class ModuleContext {
  constructor(
    public appModule: AppModule,
    public controllerModule?: ControllerModule,
    public actionModule?: ActionModule
  ) {}
}
