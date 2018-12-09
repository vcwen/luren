import { List, Map } from 'immutable'
import { Container } from 'inversify'
import { Constructor } from '../types/Constructor'

export interface IGlobal {
  getContainer(): Container
  registerController(constructor: Constructor): void
  getControllerIds(): List<symbol>
}
class Global implements IGlobal {
  private _container: Container = new Container()
  private _controllers: Map<symbol, Constructor> = Map()
  public registerController(constructor: Constructor) {
    this._container.bind(constructor).to(constructor)
    this._controllers = this._controllers.set(Symbol(constructor.name), constructor)
  }
  public getControllerIds() {
    return List(this._controllers.keys())
  }
  public getContainer() {
    return this._container
  }
}

export const global: IGlobal = new Global()
export default global
