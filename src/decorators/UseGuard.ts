import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants/MetadataKey'
import { getClassInstance } from '../lib/utils'
import { Constructor } from '../types/Constructor'
import { MountType } from '../constants'
import { UseMiddleware } from './UseMiddleware'
import { Guard, DummyGuard, GuardGroup } from '../processors/Guard'
import { Map } from 'immutable'

export function UseGuard(guard: Guard | Constructor<Guard>, mountType: MountType = MountType.INTEGRATE) {
  return UseGuards([guard], mountType)
}

export function UseGuards(guards: (Guard | Constructor<Guard>)[], mountType: MountType = MountType.INTEGRATE) {
  return (...args: any[]) => {
    if (guards.length === 0) {
      return
    }
    const guardInstances = guards.map((g) => {
      if (typeof g === 'function') {
        if (Guard.isPrototypeOf(g)) {
          return getClassInstance<Guard>(g as any)
        } else {
          return g
        }
      } else if (g instanceof Guard) {
        return g
      } else {
        throw new TypeError('Invalid guard type')
      }
    }) as Guard[]

    UseMiddleware(...guardInstances)(...args)
    if (args.length === 1) {
      const [constructor] = args
      let guardMap: Map<string, GuardGroup> = Reflect.getOwnMetadata(MetadataKey.GUARDS, constructor.prototype) ?? Map()
      const groups = _.groupBy(guardInstances, 'type')
      const types = Object.getOwnPropertyNames(groups)
      for (const type of types) {
        if (mountType === MountType.OVERRIDE) {
          guardMap = guardMap.set(type, new GuardGroup(mountType, groups[type]))
        } else {
          const guardGroup = guardMap.get(type, new GuardGroup(MountType.INTEGRATE, []))
          guardGroup.addGuards(...groups[type])
          guardMap = guardMap.set(type, guardGroup)
        }
        Reflect.defineMetadata(MetadataKey.GUARDS, guardMap, constructor.prototype)
      }
    } else {
      const [target, propertyKey] = args
      let guardMap: Map<string, GuardGroup> = Reflect.getOwnMetadata(MetadataKey.GUARDS, target, propertyKey) ?? Map()
      const groups = _.groupBy(guardInstances, 'type')
      const types = Object.getOwnPropertyNames(groups)
      for (const type of types) {
        if (mountType === MountType.OVERRIDE) {
          guardMap = guardMap.set(type, new GuardGroup(mountType, groups[type]))
        } else {
          const guardGroup: GuardGroup = guardMap.get(type, new GuardGroup(MountType.INTEGRATE, []))
          guardGroup.addGuards(...groups[type])
          guardMap = guardMap.set(type, guardGroup)
        }
      }
      Reflect.defineMetadata(MetadataKey.GUARDS, guardMap, target, propertyKey)
    }
  }
}

export function DisableGuards(type: string) {
  return (...args: any[]) => {
    UseGuard(new DummyGuard(type), MountType.OVERRIDE)(...args)
  }
}
