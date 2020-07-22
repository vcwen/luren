import { MetadataKey } from '../constants'
import { List, Map } from 'immutable'
import _ from 'lodash'

class ParameterizedDecoratorModule {
  // tslint:disable-next-line: ban-types
  constructor(public paramNames: string[], public executable: Function, public context: any[]) {}
}

export function TemplateParams(...paramNames: string[]) {
  return (parameterizedDecorator: (...values: any[]) => any) => (...context: any[]) => {
    const parameterizedDecoratorModule = new ParameterizedDecoratorModule(paramNames, parameterizedDecorator, context)
    if (context.length === 1) {
      const [constructor] = context
      const parameterizedDecoratorModules: Map<string, List<ParameterizedDecoratorModule>> =
        Reflect.getMetadata(MetadataKey.PARAMETERIZED_DECORATORS, constructor.prototype) ?? Map()
      const existingPropModules: List<ParameterizedDecoratorModule> =
        parameterizedDecoratorModules.get('__default__') ?? List()
      Reflect.defineMetadata(
        MetadataKey.PARAMETERIZED_DECORATORS,
        parameterizedDecoratorModules.set('__default__', existingPropModules.push(parameterizedDecoratorModule)),
        constructor.prototype
      )
    } else {
      const [target, prop] = context
      const parameterizedDecoratorModules: Map<string, List<ParameterizedDecoratorModule>> =
        Reflect.getMetadata(MetadataKey.PARAMETERIZED_DECORATORS, target) ?? Map()
      const existingModules: List<ParameterizedDecoratorModule> = parameterizedDecoratorModules.get(prop) ?? List()
      Reflect.defineMetadata(
        MetadataKey.PARAMETERIZED_DECORATORS,
        parameterizedDecoratorModules.set(prop, existingModules.push(parameterizedDecoratorModule)),
        target
      )
    }
  }
}

export function SetTemplateParams(params: { [key: string]: any } = {}) {
  return (...context: any[]) => {
    if (context.length === 1) {
      const [constructor] = context
      const parameterizedModules: Map<string, List<ParameterizedDecoratorModule>> =
        Reflect.getMetadata(MetadataKey.PARAMETERIZED_DECORATORS, constructor.prototype) ?? Map()
      for (const [prop, modules] of parameterizedModules.entries()) {
        const existingParams =
          Reflect.getOwnMetadata(MetadataKey.TEMPLATE_PARAMETERS, constructor.prototype, prop) ?? Map()
        for (const module of modules) {
          const availableParams = { ...params, ...existingParams }
          let expectedParams = Object.keys(availableParams).map((p) => availableParams[p])
          if (module.paramNames.length > 0) {
            expectedParams = module.paramNames.map((name) => {
              const p = availableParams[name]
              if (!p) {
                throw new Error(
                  `[${constructor.name}${
                    prop === '__default__' ? '' : '.' + prop
                  }]:Template parameter ${name} is required`
                )
              } else {
                return p
              }
            })
            module.executable(...expectedParams)(constructor.prototype, ..._.tail(module.context))
          } else {
            module.executable(availableParams)(constructor.prototype, ..._.tail(module.context))
          }
        }
      }
    } else {
      const [target, prop] = context
      Reflect.defineMetadata(MetadataKey.TEMPLATE_PARAMETERS, { ...params }, target, prop)
    }
  }
}
