import { List } from 'immutable'
import { Container, interfaces } from 'inversify'
import { Constructor } from '../types/Constructor'

export interface IGlobal {
  getContainer(): Container
  registerController(constructor: Constructor): void
  getControllers(): List<Constructor>
  inversifyBind<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>, constructor: Constructor): void
}
class Global implements IGlobal {
  private container: Container = new Container()
  private controllers: List<Constructor> = List()
  public registerController(constructor: Constructor) {
    this.container.bind(constructor).to(constructor)
    this.controllers = this.controllers.push(constructor)
  }
  public getControllers() {
    return this.controllers
  }
  public inversifyBind<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>, constructor: Constructor) {
    this.container.bind(serviceIdentifier).to(constructor)
  }
  public getContainer() {
    return this.container
  }
}

export const global: IGlobal = new Global()
export default global
