/* tslint:disable: max-classes-per-file */
import { Processor, ExecutionContext, ModuleContext, HttpException } from '../lib'
import { INext } from '../types'
import { MountType } from '../constants'
import { v4 as uuid } from 'uuid'
import { List } from 'immutable'

export class ValidationResult {
  public static ok() {
    return new ValidationResult(true)
  }
  public static invalid(error: HttpException) {
    return new ValidationResult(false, error)
  }
  public valid: boolean
  public error?: HttpException
  constructor(valid: boolean, error?: HttpException) {
    this.valid = valid
    this.error = error
  }
}

export class GuardGroup {
  public mountType: MountType
  public guards: List<Guard>
  constructor(mountType: MountType, guards: Guard[]) {
    this.mountType = mountType
    this.guards = List(guards)
  }
  public addGuards(...guards: Guard[]) {
    this.guards = this.guards.concat(guards)
    return this
  }
}

const getExpectedGuards = (type: string, moduleContext: ModuleContext) => {
  const guardGroup = moduleContext.appModule.guards.get(type) ?? new GuardGroup(MountType.INTEGRATE, [])
  let guards = guardGroup.guards
  if (moduleContext.controllerModule) {
    const ctrlGuardGroup = moduleContext.controllerModule.guards.get(type) ?? new GuardGroup(MountType.INTEGRATE, [])
    if (ctrlGuardGroup.mountType === MountType.OVERRIDE) {
      guards = ctrlGuardGroup.guards
    } else {
      guards = guards.concat(ctrlGuardGroup.guards)
    }
    if (moduleContext.actionModule) {
      const actionGuardGroup = moduleContext.actionModule.guards.get(type) ?? new GuardGroup(MountType.INTEGRATE, [])
      if (actionGuardGroup.mountType === MountType.OVERRIDE) {
        guards = actionGuardGroup.guards
      } else {
        guards = guards.concat(actionGuardGroup.guards)
      }
    }
  }
  return guards
}

export const isExpectedGuard = (guard: Guard, execCtx: ExecutionContext) => {
  if (execCtx.moduleContext) {
    const expectedGuards = getExpectedGuards(guard.type, execCtx.moduleContext)
    return expectedGuards.some((item) => item.id === guard.id)
  } else {
    return true
  }
}

export interface IGuardOptions {
  include?: string | RegExp | ((execContext: ExecutionContext) => Promise<boolean>)
  exclude?: string | RegExp | ((execContext: ExecutionContext) => Promise<boolean>)
}

export abstract class Guard extends Processor {
  public id: string
  public abstract type: string
  private _include?: (execContext: ExecutionContext) => Promise<boolean>
  private _exclude?: (execContext: ExecutionContext) => Promise<boolean>
  public constructor(options?: IGuardOptions) {
    super()
    this.id = uuid()
    if (options?.include) {
      if (typeof options.include === 'function') {
        this._include = options.include
      } else {
        let pathRegex: RegExp
        if (typeof options.include === 'string') {
          pathRegex = new RegExp(options.include)
        } else if (options.include instanceof RegExp) {
          pathRegex = options.include
        } else {
          throw new TypeError(`Invalid include value:${options.include}`)
        }
        this._include = async (execContext: ExecutionContext) => {
          return pathRegex.test(execContext.httpContext.path)
        }
      }
    }
    if (options?.exclude) {
      if (typeof options.exclude === 'function') {
        this._exclude = options.exclude
      } else {
        let pathRegex: RegExp
        if (typeof options.exclude === 'string') {
          pathRegex = new RegExp(options.exclude)
        } else if (options.exclude instanceof RegExp) {
          pathRegex = options.exclude
        } else {
          throw new TypeError(`Invalid exclude value:${options.exclude}`)
        }
        this._exclude = async (execContext: ExecutionContext) => {
          return pathRegex.test(execContext.httpContext.path)
        }
      }
    }
  }
  public async process(execCtx: ExecutionContext, next: INext) {
    let shouldRun = true
    if (this._include) {
      shouldRun = await this._include(execCtx)
    }
    if (shouldRun && this._exclude) {
      shouldRun = !(await this._exclude(execCtx))
    }
    if (shouldRun) {
      shouldRun = isExpectedGuard(this, execCtx)
    }

    if (shouldRun) {
      const valid = await this.validate(execCtx)
      if (valid) {
        return next()
      } else {
        // default 403 Forbidden
        throw HttpException.forbidden()
      }
    } else {
      return next()
    }
  }
  public abstract async validate(execCtx: ExecutionContext): Promise<boolean>
}
export class DummyGuard extends Guard {
  public type: string
  constructor(targetType: string) {
    super()
    this.type = targetType
  }
  public async validate(): Promise<boolean> {
    return true
  }
}
