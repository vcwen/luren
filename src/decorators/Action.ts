import { Map } from 'immutable'
import 'reflect-metadata'
import { HttpMethod } from '../constants/HttpMethod'
import { MetadataKey } from '../constants/MetadataKey'
import { PropertyDecorator } from '../types/PropertyDecorator'

export interface IActionOptions {
  name?: string
  path?: string
  method?: HttpMethod
  version?: string
  deprecated?: boolean
  desc?: string
}

export class ActionMetadata {
  public name: string
  public path: string
  public method: HttpMethod
  public deprecated: boolean = false
  public version?: string
  public desc?: string
  constructor(name: string, method: HttpMethod, path: string, version?: string, desc?: string) {
    this.name = name
    this.method = method
    this.path = path
    this.version = version
    this.desc = desc
  }
}

const getActionMetadata = (options: IActionOptions, _: object, propertyKey: string) => {
  const name = options.name || propertyKey
  const method = options.method || HttpMethod.GET
  const path = options.path || '/' + propertyKey
  const metadata = new ActionMetadata(name, method, path, options.version, options.desc)
  return metadata
}

export function Action(options: IActionOptions = {}): PropertyDecorator {
  return (target: object, propertyKey: string) => {
    const metadata = getActionMetadata(options, target, propertyKey)
    let actionMetadataMap: Map<string, ActionMetadata> = Reflect.getMetadata(MetadataKey.ACTIONS, target) || Map()
    actionMetadataMap = actionMetadataMap.set(propertyKey, metadata)
    Reflect.defineMetadata(MetadataKey.ACTIONS, actionMetadataMap, target)
  }
}

function methodifyActionDecorator(method: HttpMethod) {
  return (options: IActionOptions = {}): PropertyDecorator => {
    return (target: object, propertyKey: string) => {
      options.method = method
      const metadata = getActionMetadata(options, target, propertyKey)
      let actionMetadataMap: Map<string, ActionMetadata> = Reflect.getMetadata(MetadataKey.ACTIONS, target) || Map()
      actionMetadataMap = actionMetadataMap.set(propertyKey, metadata)
      Reflect.defineMetadata(MetadataKey.ACTIONS, actionMetadataMap, target)
    }
  }
}

export function Get(options?: IActionOptions): PropertyDecorator {
  return methodifyActionDecorator(HttpMethod.GET)(options)
}

export function Post(options?: IActionOptions) {
  return methodifyActionDecorator(HttpMethod.POST)(options)
}

export function Put(options?: IActionOptions): PropertyDecorator {
  return methodifyActionDecorator(HttpMethod.PUT)(options)
}

export function Patch(options?: IActionOptions): PropertyDecorator {
  return methodifyActionDecorator(HttpMethod.PATCH)(options)
}

export function Delete(options?: IActionOptions): PropertyDecorator {
  return methodifyActionDecorator(HttpMethod.DELETE)(options)
}
