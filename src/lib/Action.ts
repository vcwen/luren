import { List, Map } from 'immutable'
import { Context, Middleware as KoaMiddleware } from 'koa'
import { HttpMethod, HttpStatusCode } from '../constants'
import { ParamMetadata } from '../decorators'
import { INext } from '../types'
import { getParams } from './helper'
import { HttpResponse } from './HttpResponse'
import { Middleware } from './Middleware'
import { GuardGroup } from '../processors/Guard'

export class ActionExecutor {
  public controller: object
  public name: string
  public params: List<ParamMetadata> = List()
  public constructor(controller: object, method: string, params?: List<ParamMetadata>) {
    this.controller = controller
    this.name = method
    if (params) {
      this.params = params
    }
  }
  public async execute(ctx: Context, next: INext) {
    const ctrl: any = this.controller
    const expectedArgs = getParams(ctx, next, this.params)
    const args = expectedArgs.size > 0 ? expectedArgs.toArray() : [ctx, next]
    const response = await ctrl[this.name].apply(ctrl, args)
    if (response instanceof HttpResponse) {
      const headers = response.getRawHeader()
      if (headers) {
        ctx.set(headers)
      }
      switch (response.status) {
        case 0: // the response is ignored
          return
        case HttpStatusCode.MOVED_PERMANENTLY:
        case HttpStatusCode.FOUND:
          ctx.redirect(response.body)
          break
        default:
          ctx.body = response.body
      }
      // set status at last, since set body might change the status
      ctx.status = response.status
    } else {
      // set response only if return value is not undefined/void
      if (response !== undefined) {
        ctx.body = response
      }
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
export class ActionModule {
  public targetController: object
  public targetFunction: string
  public name: string
  public actionExecutor: ActionExecutor
  public params: List<ParamMetadata> = List()
  public path: string
  public method: HttpMethod
  public middleware: List<Middleware | KoaMiddleware> = List()
  public guards: Map<string, GuardGroup> = Map()
  public deprecated: boolean = false
  public version?: string
  public desc?: string
  public summary?: string
  constructor(
    targetController: object,
    targetFunction: string,
    name: string,
    method: HttpMethod,
    path: string,
    params: List<ParamMetadata>
  ) {
    this.targetController = targetController
    this.targetFunction = targetFunction
    this.name = name
    this.method = method
    this.path = path
    this.params = params
    this.actionExecutor = new ActionExecutor(targetController, targetFunction, params)
  }
}
