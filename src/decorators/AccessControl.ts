import { List } from 'immutable'
import { IRouterContext } from 'koa-router'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { Constructor } from '../types/Constructor'

export type IAuthorize = (ctx: IRouterContext, user: any, params: { [key: string]: any }) => boolean

export class AccessControlMetadata {
  public resource?: string
  public action: string
  public mode: string
  public authorize?: IAuthorize
  public tags?: string[]
  constructor(action: string, mode: string) {
    this.action = action
    this.mode = mode
  }
}

// tslint:disable-next-line: max-classes-per-file
export class ResourceMetadata {
  public name: string
  constructor(name: string) {
    this.name = name
  }
}

export function AccessControl(options?: { action?: string; tag?: string; mode?: string; auth?: IAuthorize }) {
  return (target: any, propertyKey: string) => {
    const mode = options && options.mode ? options.mode : ''
    const action = options && options.action ? options.action : propertyKey
    const acMetadata = new AccessControlMetadata(action, mode)
    let acl: List<AccessControlMetadata> = Reflect.getOwnMetadata(MetadataKey.ACL, target, propertyKey) || List()
    acl = acl.push(acMetadata)
    Reflect.defineMetadata(MetadataKey.ACL, acl, target, propertyKey)
  }
}

export function Resource(name: string) {
  const resMetadata = new ResourceMetadata(name)
  return (constructor: Constructor<any>) => {
    Reflect.defineMetadata(MetadataKey.RESOURCE, resMetadata, constructor.prototype)
  }
}
