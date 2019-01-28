import { List, Map } from 'immutable'
import { Container } from 'inversify'
import { Constructor } from '../types/Constructor'

const container = new Container()
let controllerIds: List<symbol> = List()
export const registerController = (constructor: Constructor) => {
  const serviceId = Symbol.for(constructor.name)
  container.bind(serviceId).to(constructor)
  controllerIds = controllerIds.push(serviceId)
}
export const getControllerIds = () => {
  return controllerIds
}
export const getContainer = () => {
  return container
}
