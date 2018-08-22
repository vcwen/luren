import _ from 'lodash'
import 'reflect-metadata'
import { Constructor } from '../types/Constructor'
import { interfaces } from 'inversify'
import lurenGlobal from '../lib/Global'

export function Bind<T>(serviceId?: interfaces.ServiceIdentifier<T>) {
  return (constructor: Constructor) => {
    if (serviceId) {
      lurenGlobal.inversifyBind(serviceId, constructor)
    } else {
      lurenGlobal.inversifyBind(constructor, constructor)
    }
  }
}
