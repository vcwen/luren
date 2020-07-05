import { Context } from 'koa'
import { Luren } from '../Luren'
import { ModuleContext } from '../lib/ModuleContext'
import { pathToRegexp } from 'path-to-regexp'
import { INext } from '../types'
import Path from 'path'

export const moduleContextInjection = (ctx: Context, next: INext) => {
  const url = ctx.path
  const app = ctx.app as Luren
  for (const ctrlModule of app.getAppModule().controllerModules) {
    const regex = pathToRegexp(Path.join(ctrlModule.prefix, ctrlModule.path), [], { end: false })
    if (regex.test(url)) {
      for (const actionModule of ctrlModule.actionModules) {
        const actionRegex = pathToRegexp(Path.join(ctrlModule.prefix, ctrlModule.path, actionModule.path))
        if (actionRegex.test(url)) {
          ctx.moduleContext = new ModuleContext(app.getAppModule(), ctrlModule, actionModule)
          return next()
        }
      }
    }
  }
  return next()
}
