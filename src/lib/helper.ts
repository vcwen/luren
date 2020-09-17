import { List, Map, Set } from 'immutable'
import { Request } from 'koa'
import _ from 'lodash'
import 'reflect-metadata'
import { MetadataKey } from '../constants'
import { ActionModule } from './Action'
import { ControllerModule } from './ControllerModule'
import { AppModule } from './AppModule'

export function createActionModule(controllerModule: ControllerModule, propKey: string) {
  const actionModule = new ActionModule(controllerModule, propKey)
  Reflect.defineMetadata(MetadataKey.ACTION_MODULE, actionModule, controllerModule.controller, propKey)
  return actionModule
}

export function createActionModules(controllerModule: ControllerModule) {
  let actions: Set<string> = Reflect.getMetadata(MetadataKey.ACTIONS, controllerModule.controller) ?? Set()
  const disabledActions: List<string> =
    Reflect.getOwnMetadata(MetadataKey.DISABLED_ACTIONS, controllerModule.controller) ?? List()
  actions = actions.filterNot((action) => disabledActions.contains(action))
  const actionModules = actions
    .map((action) => {
      return createActionModule(controllerModule, action)
    })
    .sort((a, b) => {
      return a.path < b.path ? 1 : -1
    })
  const counter = Map<string, number>().withMutations((mutable) => {
    for (const m of actionModules) {
      const reqPath = m.method + '-' + m.path
      if (mutable.has(reqPath)) {
        mutable.set(reqPath, mutable.get(reqPath)! + 1)
      } else {
        mutable.set(reqPath, 1)
      }
    }
  })
  counter.forEach((value, key) => {
    if (value > 1) {
      const names = actionModules
        .filter((item) => {
          const [method, path] = key.split('-')
          return item.method === method && item.path === path
        })
        .map((item) => item.targetFunction)
      throw new Error(
        `[${controllerModule.controller.constructor.name}] Path:${key} is defined by multiple actions - ${names}`
      )
    }
  })
  return actionModules.toList()
}
export function createControllerModule(appModule: AppModule, ctrl: object) {
  const controllerModule = new ControllerModule(appModule, ctrl)
  controllerModule.actionModules = createActionModules(controllerModule)
  Reflect.defineMetadata(MetadataKey.CONTROLLER_MODULE, controllerModule, ctrl)
  return controllerModule
}

export const getRequestParam = (request: Request, key: string, source: string) => {
  switch (source) {
    case 'header':
      return _.get(request, ['header', key.toLowerCase()])
    case 'path':
      return _.get(request, ['params', key])
    case 'query':
      return _.get(request, ['query', key])
    case 'body':
      return _.get(request, ['body', key])
  }
}
