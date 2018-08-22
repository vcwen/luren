import { interfaces } from 'inversify'
import _ from 'lodash'
import 'reflect-metadata'
import lurenGlobal from '../lib/Global'
import { Constructor } from '../types/Constructor'

export function Bind<T>(serviceId?: interfaces.ServiceIdentifier<T>) {
  return (constructor: Constructor) => {
    if (serviceId) {
      lurenGlobal.inversifyBind(serviceId, constructor)
    } else {
      lurenGlobal.inversifyBind(constructor, constructor)
    }
  }
}
