import { MetadataKey } from '../constants'
import { HttpException } from '../lib'
import { ExecutionContext } from '../lib/ExecutionContext'
import { INext } from '../types'
import { IProcessor, Processor } from './Processor'
import { ModuleContext } from '../lib/ModuleContext'
import { ExecutionLevel } from '../constants/ExecutionLevel'
import { List } from 'immutable'

export interface IAuthorizer extends IProcessor {
  authorize(execCtx: ExecutionContext): Promise<boolean | [boolean, string]>
}
export abstract class Authorizer extends Processor implements IAuthorizer {
  public async process(execCtx: ExecutionContext, next: INext) {
    const res = await this.authorize(execCtx)
    let valid = false
    let message: string | undefined
    if (Array.isArray(res)) {
      ;[valid, message] = res
    } else {
      valid = res
    }
    if (valid) {
      return next()
    } else {
      throw HttpException.forbidden(message)
    }
  }
  public onMount(level: ExecutionLevel, moduleContext: ModuleContext) {
    switch (level) {
      case ExecutionLevel.ACTION: {
        const ctx = moduleContext as Required<ModuleContext>
        const authorizers: List<any> =
          Reflect.getMetadata(MetadataKey.AUTHORIZERS, ctx.controllerModule.controller, ctx.actionModule.action.name) ||
          List()
        Reflect.defineMetadata(
          MetadataKey.AUTHORIZERS,
          authorizers.push(this.getDescriptor()),
          ctx.controllerModule,
          ctx.actionModule!.action.name
        )
        break
      }
      case ExecutionLevel.CONTROLLER: {
        const ctx = moduleContext as Required<Omit<ModuleContext, 'actionModule'>>
        const authorizers: List<any> =
          Reflect.getMetadata(MetadataKey.AUTHORIZERS, ctx.controllerModule.controller) || List()
        Reflect.defineMetadata(MetadataKey.AUTHORIZERS, authorizers.push(this.getDescriptor()), ctx.controllerModule)
        break
      }
      case ExecutionLevel.APP: {
        const ctx = moduleContext
        const authorizers: List<any> = Reflect.getMetadata(MetadataKey.AUTHORIZERS, ctx.app) || List()
        Reflect.defineMetadata(MetadataKey.AUTHORIZERS, authorizers.push(this.getDescriptor()), ctx.app)
        break
      }
    }
  }
  public abstract async authorize(execCtx: ExecutionContext): Promise<boolean | [boolean, string]>
  public abstract getDescriptor(): any
}
