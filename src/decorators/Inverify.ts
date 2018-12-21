import { injectable,inject, interfaces } from 'inversify'
import 'reflect-metadata'
import lurenGlobal from '../lib/Global'
import { Constructor } from '../types/Constructor'
export { inject } from 'inversify'

export function Injectable<T>(serviceId?: interfaces.ServiceIdentifier<T>) {
  return (constructor: Constructor) => {
    injectable()(constructor)
    const container = lurenGlobal.getContainer()
    if (serviceId) {
      container.bind(serviceId).to(constructor)
    } else {
      container.bind(constructor).to(constructor)
    }
  }
}

export const Inject = inject
