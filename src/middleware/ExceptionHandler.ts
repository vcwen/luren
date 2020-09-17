import { Context, Next } from 'koa'
import { HttpStatusCode } from '../constants'
import { HttpException } from '../lib/HttpException'

export const exceptionHandler = async (ctx: Context, next: Next): Promise<any> => {
  try {
    await next()
  } catch (err) {
    if (HttpException.isHttpException(err)) {
      ctx.body = err.getBody()
      const headers = err.getRawHeader()
      if (headers) {
        ctx.set(headers)
      }
      ctx.status = err.status
      if (err.isSeverException()) {
        ctx.app.emit('error', err)
      }
    } else {
      ctx.body = 'Internal Server Error'
      ctx.set('Content-Type', 'text/plain')
      ctx.status = HttpStatusCode.INTERNAL_SERVER_ERROR
      ctx.app.emit('error', err)
    }
  }
}
