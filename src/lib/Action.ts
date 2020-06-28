import { List } from 'immutable'
import { Context, Middleware as KoaMiddleware } from 'koa'
import { HttpMethod, HttpStatusCode, MetadataKey } from '../constants'
import { ParamMetadata } from '../decorators'
import { INext } from '../types'
import { getParams } from './helper'
import { HttpResponse } from './HttpResponse'
import { Middleware } from './Middleware'

export class ActionExecutor {
  public controller: object
  public name: string
  public constructor(controller: object, method: string) {
    this.controller = controller
    this.name = method
  }
  public async execute(ctx: Context, next: INext) {
    const ctrl: any = this.controller
    const paramsMetadata: List<ParamMetadata> =
      Reflect.getOwnMetadata(MetadataKey.PARAMS, Reflect.getPrototypeOf(ctrl), this.name) || List()
    const args = getParams(ctx, next, paramsMetadata)
    const response = await ctrl[this.name].apply(ctrl, args.toArray())
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
      ctx.body = response
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
export class ActionModule {
  public name: string
  public action: ActionExecutor
  public path: string
  public method: HttpMethod
  public middleware: List<Middleware | KoaMiddleware> = List()
  public deprecated: boolean = false
  public version?: string
  public desc?: string
  constructor(name: string, method: HttpMethod, path: string, action: ActionExecutor) {
    this.name = name
    this.action = action
    this.method = method
    this.path = path
  }
}
