import { MetadataKey } from '../constants'
import { AuthenticationScope } from '../constants/AuthenticationScope'

export function AuthenticatorScope(scope: AuthenticationScope) {
  return (...args: any[]) => {
    if (args.length === 1) {
      const [constructor] = args
      Reflect.defineMetadata(MetadataKey.AUTHENTICATION_SCOPE, scope, constructor.prototype)
    } else {
      const [target, propertyKey] = args
      Reflect.defineMetadata(MetadataKey.AUTHENTICATION_SCOPE, scope, target, propertyKey)
    }
  }
}
