import { Context } from 'koa'
import bodyParser from 'koa-bodyparser'
import Processor from '../lib/Processor'
import { parseFormData } from '../lib/utils'
import { INext } from '../types'

export default class BodyParser extends Processor {
  public async process(ctx: Context, next: INext) {
    if (Reflect.get(ctx.request, 'body') !== undefined) {
      return await next()
    }
    if (ctx.is('multipart/form-data')) {
      const { fields, files } = await parseFormData(ctx)
      const request: any = ctx.request
      request.body = fields
      request.files = files
      await next()
    } else {
      await bodyParser()(ctx, next)
    }
  }
}
