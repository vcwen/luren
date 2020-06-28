import { Context } from 'koa'
import { HttpStatusCode } from '../constants'
import { HttpException } from '../lib/HttpException'
import { INext } from '../types'

export const exceptionHandler = async (ctx: Context, next: INext): Promise<any> => {
  try {
    await next()
  } catch (err) {
    ctx.app.emit('error', err)
    if (HttpException.isHttpException(err)) {
      ctx.body = err.getBody()
      const headers = err.getRawHeader()
      if (headers) {
        ctx.set(headers)
      }
      ctx.status = err.status
    } else {
      ctx.body = 'Internal Server Error'
      ctx.set('Content-Type', 'text/plain')
      ctx.status = HttpStatusCode.INTERNAL_SERVER_ERROR
    }
  }
}
