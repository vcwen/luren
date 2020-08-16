import { MetadataKey } from '../constants'
import { Map } from 'immutable'

export function GenericParams(params: { [key: string]: any } = {}) {
  return (...context: any[]) => {
    if (context.length === 1) {
      const [constructor] = context
      Reflect.defineMetadata(MetadataKey.GENERIC_PARAMETERS, Map(params), constructor.prototype)
    } else {
      const [target, prop] = context
      Reflect.defineMetadata(MetadataKey.GENERIC_PARAMETERS, Map(params), target, prop)
    }
  }
}
