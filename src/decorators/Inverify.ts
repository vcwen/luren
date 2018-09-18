import { injectable, interfaces } from 'inversify'
import 'reflect-metadata'
import lurenGlobal from '../lib/Global'
import { Constructor } from '../types/Constructor'
export {inject as Inject} from 'inversify'

export function Bind<T>(serviceId?: interfaces.ServiceIdentifier<T>) {
  return (constructor: Constructor) => {
    if (serviceId) {
      lurenGlobal.inversifyBind(serviceId, constructor)
    } else {
      lurenGlobal.inversifyBind(constructor, constructor)
    }
  }
}

export function Injectable<T>(serviceId?: interfaces.ServiceIdentifier<T>) {
  return (constructor: Constructor) => {
    injectable()(constructor)
    Bind(serviceId)(constructor)
  }
}
