import { List } from 'immutable'
import { IRouterContext } from 'koa-router'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'

export type AclType = 'chain' | 'sole' | 'force'
export type IAuthenticate = (ctx: IRouterContext, user: any, params: any, ...args: any[]) => boolean
export class AclMetadata {
  public type: AclType = 'chain'
  public realms: string[]
  public roles: { inclusive?: string[]; exclusive?: string[] }
  public authenticate?: IAuthenticate
  constructor(
    type: AclType,
    realms: string[],
    roles: { inclusive?: string[]; exclusive?: string[] },
    authenticate?: IAuthenticate
  ) {
    this.type = type
    this.realms = realms
    this.roles = roles
    this.authenticate = authenticate
  }
}

export function ACL(options: {
  type?: AclType
  realm?: string
  realms?: string[]
  role?: string
  roles?: string[] | { inclusive?: string[]; exclusive?: string[] }
  authenticate?: IAuthenticate
}) {
  return (...args: any[]) => {
    const type = options.type || 'chain'
    let realms: string[] = []
    let inclusive: string[] = []
    let exclusive: string[] = []
    if (options.realm) {
      realms.push(options.realm)
    }
    if (options.realms) {
      realms = realms.concat(options.realms)
    }
    if (options.role) {
      inclusive.push(options.role)
    }
    if (options.roles) {
      if (Array.isArray(options.roles)) {
        inclusive = inclusive.concat(options.roles)
      } else {
        if (options.roles.inclusive) {
          inclusive = inclusive.concat(options.roles.inclusive)
        }
        if (options.roles.exclusive) {
          exclusive = exclusive.concat(options.roles.exclusive)
        }
      }
    }
    const roles: { inclusive?: string[]; exclusive?: string[] } = {}
    if (!_.isEmpty(inclusive)) {
      roles.inclusive = inclusive
    }
    if (!_.isEmpty(exclusive)) {
      roles.exclusive = exclusive
    }
    const acl = new AclMetadata(type, realms, roles, options.authenticate)
    if (args.length === 1) {
      const [constructor] = args
      let aclList: List<AclMetadata> = Reflect.getOwnMetadata(MetadataKey.ACL, constructor.prototype) || List()
      aclList = aclList.push(acl)
      Reflect.defineMetadata(MetadataKey.ACL, aclList, constructor.prototype)
    } else {
      const [target, propertyKey] = args
      let aclList: List<AclMetadata> = Reflect.getOwnMetadata(MetadataKey.ACL, target, propertyKey) || List()
      aclList = aclList.push(acl)
      Reflect.defineMetadata(MetadataKey.MIDDLEWARE, aclList, target, propertyKey)
    }
  }
}
