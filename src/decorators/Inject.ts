import { inject, injectable, interfaces } from 'inversify'
import { Scope } from '../constants'
import { container } from '../lib/container'

export interface IInjectableOptions {
  scope?: Scope
  autoBind?: boolean
  name?: string
  tag?: { [key: string]: any }
}

export interface IInjectOptions {
  scope?: Scope
  autoBind?: boolean
}

function bindingScope(bindingInWhenOn: interfaces.BindingInWhenOnSyntax<any>, scope?: Scope) {
  switch (scope) {
    case Scope.SINGLETON:
      return bindingInWhenOn.inSingletonScope()
    case Scope.REQUEST:
      return bindingInWhenOn.inRequestScope()
    default:
      return bindingInWhenOn.inTransientScope()
  }
}

export function Inject(serviceIdentifier: any, options?: IInjectOptions) {
  return (target: any, propertyKey: string) => {
    if (typeof serviceIdentifier === 'function') {
      const autoBind: boolean = options && typeof options.autoBind === 'boolean' ? options.autoBind : true
      if (autoBind && !container.isBound(serviceIdentifier)) {
        injectable()(serviceIdentifier)
        const bindingInWhenOn = container.bind(serviceIdentifier).toSelf()
        bindingScope(bindingInWhenOn, options && options.scope)
      }
    } else if (options) {
      throw new Error('injection options only works for class as service identifier')
    }
    inject(serviceIdentifier)(target, propertyKey)
  }
}

export function Injectable(
  serviceIdentifier: any,
  options: IInjectableOptions = { scope: Scope.TRANSIENT, autoBind: true }
) {
  const autoBind: boolean = typeof options.autoBind === 'boolean' ? options.autoBind : true
  return (target: any) => {
    injectable()(target)
    if (autoBind) {
      const bindingInWhenOn = container.bind(serviceIdentifier).to(target)
      const bindingWhenOn = bindingScope(bindingInWhenOn, options.scope)
      if (options.tag) {
        const keys = Reflect.ownKeys(options.tag)
        for (const key of keys) {
          bindingWhenOn.whenTargetTagged(key, Reflect.get(options.tag, key))
        }
      }
    }
  }
}
