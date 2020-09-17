import { Context, Next } from 'koa'
import koaBodyParser from 'koa-bodyparser'
import { parseFormData } from '../lib/utils'

export const bodyParser = async (ctx: Context, next: Next) => {
  if (Reflect.get(ctx.request, 'body') !== undefined) {
    return next()
  }
  if (ctx.is('multipart/form-data')) {
    const { fields, files } = await parseFormData(ctx)
    const request: any = ctx.request
    request.body = fields
    request.files = files
    return next()
  } else {
    return koaBodyParser()(ctx as any, next)
  }
}
