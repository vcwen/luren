import { List, Set } from 'immutable'
import 'reflect-metadata'
import { HttpMethod } from '../constants/HttpMethod'
import { MetadataKey } from '../constants/MetadataKey'
import { PropertyDecorator } from '../types/PropertyDecorator'
import { ParamMetadata } from './Param'

export interface IActionOptions {
  name?: string
  path?: string
  method?: HttpMethod
  version?: string
  deprecated?: boolean
  summary?: string
  desc?: string
}

// tslint:disable-next-line: max-classes-per-file
export class ActionMetadata {
  public name: string
  public path: string
  public method: HttpMethod
  public deprecated: boolean = false
  public version?: string
  public summary?: string
  public desc?: string
  constructor(name: string, method: HttpMethod, path: string) {
    this.name = name
    this.method = method
    this.path = path
  }
}

const getActionMetadata = (options: IActionOptions, property: string) => {
  const name = options.name || property
  const method = options.method || HttpMethod.GET
  // remove the leading /, since it's actually relative path
  const path = (options.path ?? property).replace(/^\//, '')
  const metadata = new ActionMetadata(name, method, path)
  if (options.version) {
    metadata.version = options.version
  }
  if (options.summary) {
    metadata.summary = options.summary
  }
  if (options.desc) {
    metadata.desc = options.desc
  }
  return metadata
}

export function Action(options: IActionOptions = {}): PropertyDecorator {
  return (target: object, propertyKey: string) => {
    const metadata = getActionMetadata(options, propertyKey)
    if (metadata.method === HttpMethod.GET) {
      const paramsMetadata: List<ParamMetadata> =
        Reflect.getOwnMetadata(MetadataKey.PARAMS, target, propertyKey) || List()
      for (const paramMetadata of paramsMetadata) {
        if (paramMetadata.source === 'body') {
          throw new Error(`Can not put params in body for ${HttpMethod.GET} request`)
        }
      }
    }
    let actions: List<string> = Reflect.getMetadata(MetadataKey.ACTIONS, target) || List()
    actions = actions.push(propertyKey)
    Reflect.defineMetadata(MetadataKey.ACTIONS, actions, target)
    Reflect.defineMetadata(MetadataKey.ACTION, metadata, target, propertyKey)
  }
}

function methodifyActionDecorator(method: HttpMethod) {
  return (options: IActionOptions = {}): PropertyDecorator => {
    options.method = method
    return Action(options)
  }
}

export function Get(options?: Omit<IActionOptions, 'method'>): PropertyDecorator {
  return methodifyActionDecorator(HttpMethod.GET)(options)
}

export function Post(options?: Omit<IActionOptions, 'method'>) {
  return methodifyActionDecorator(HttpMethod.POST)(options)
}

export function Put(options?: Omit<IActionOptions, 'method'>): PropertyDecorator {
  return methodifyActionDecorator(HttpMethod.PUT)(options)
}

export function Patch(options?: Omit<IActionOptions, 'method'>): PropertyDecorator {
  return methodifyActionDecorator(HttpMethod.PATCH)(options)
}

export function Delete(options?: Omit<IActionOptions, 'method'>): PropertyDecorator {
  return methodifyActionDecorator(HttpMethod.DELETE)(options)
}

export function DisableAction() {
  return (target: object, propertyKey: string) => {
    let disabledActions: List<string> = Reflect.getOwnMetadata(MetadataKey.DISABLED_ACTIONS, target) || List()
    if (!disabledActions.contains(propertyKey)) {
      disabledActions = disabledActions.push(propertyKey)
      Reflect.defineMetadata(MetadataKey.DISABLED_ACTIONS, disabledActions, target, propertyKey)
    }
  }
}

export function DisableActions<T>(...actions: (keyof T & string)[]) {
  return (target: object) => {
    let disabledActions: List<string> = Reflect.getOwnMetadata(MetadataKey.DISABLED_ACTIONS, target) || List()
    disabledActions = Set(disabledActions.concat(actions)).toList()
    Reflect.defineMetadata(MetadataKey.DISABLED_ACTIONS, disabledActions, target)
  }
}
