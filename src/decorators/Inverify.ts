import { inject, injectable, interfaces } from 'inversify'
import 'reflect-metadata'
import { getContainer } from '../lib/global'
import { Constructor } from '../types/Constructor'
export { inject } from 'inversify'

export function Injectable<T>(serviceId?: interfaces.ServiceIdentifier<T>) {
  return (constructor: Constructor) => {
    injectable()(constructor)
    const container = getContainer()
    if (serviceId) {
      container.bind(serviceId).to(constructor)
    } else {
      container.bind(Symbol.for(constructor.name)).to(constructor)
    }
  }
}

export const Inject = inject
