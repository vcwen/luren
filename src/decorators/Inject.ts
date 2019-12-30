import { inject, injectable, interfaces } from 'inversify'
import { Scope } from '../constants'
import { container } from '../lib/container'

export interface IInjectableOptions {
  serviceIdentifier?: any
  scope?: Scope
  autoBind?: boolean
  name?: string
  tag?: { [key: string]: any }
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

export function Inject(serviceIdentifier: any) {
  return (target: any, propertyKey: string) => {
    inject(serviceIdentifier)(target, propertyKey)
  }
}

export function Injectable(options: IInjectableOptions = { scope: Scope.TRANSIENT, autoBind: true }) {
  const autoBind: boolean = typeof options.autoBind === 'boolean' ? options.autoBind : true
  return (target: any) => {
    injectable()(target)
    if (autoBind) {
      const serviceId = options.serviceIdentifier || target
      const bindingInWhenOn = container.bind(serviceId).to(target)
      const bindingWhenOn = bindingScope(bindingInWhenOn, options.scope)
      if (options.name) {
        bindingInWhenOn.whenTargetNamed(name)
      }
      if (options.tag) {
        const keys = Reflect.ownKeys(options.tag)
        for (const key of keys) {
          bindingWhenOn.whenTargetTagged(key, Reflect.get(options.tag, key))
        }
      }
    }
  }
}
