import { HttpStatusCode } from '../constants/HttpStatusCode'
import IHttpHeader from '../types/HttpHeader'
import { IHttpResponse } from './HttpResponse'
import { toRawHeader } from './utils'

export interface IHttpErrorOptions {
  code?: number
  headers?: IHttpHeader
}
export class HttpError extends Error implements IHttpResponse {
  public static isHttpError(error: any): error is HttpError {
    return error instanceof Error && error instanceof HttpError
  }

  public static badRequest(message?: string, options?: IHttpErrorOptions): HttpError {
    return new HttpError(HttpStatusCode.BAD_REQUEST, message, options)
  }
  public static unauthorized(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.UNAUTHORIZED, message, options)
  }
  public static toHttpError(error: Error) {
    if (!(error instanceof Error)) {
      throw new Error('only error can be converted to http error')
    } else {
      return new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR,  error.message)
    }
  }

  public static paymentRequired(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.PAYMENT_REQUIRED, message, options)
  }
  public static forbidden(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.FORBIDDEN, message, options)
  }
  public static notFound(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.NOT_FOUND, message, options)
  }
  public static methodNotAllowed(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.METHOD_NOT_ALLOWED, message, options)
  }
  public static notAcceptable(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.NOT_ACCEPTABLE, message, options)
  }
  public static proxyAuthRequired(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.PROXY_AUTH_REQUIRED, message, options)
  }
  public static clientTimeout(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.CLIENT_TIMEOUT, message, options)
  }
  public static conflict(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.CONFLICT, message, options)
  }
  public static resourceGone(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.RESOURCE_GONE, message, options)
  }

  public static lengthRequired(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.LENGTH_REQUIRED, message, options)
  }
  public static preconditionFailed(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.PRECONDITION_FAILED, message, options)
  }
  public static entityTooLarge(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.ENTITY_TOO_LARGE, message, options)
  }
  public static uriTooLong(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.URI_TOO_LONG, message, options)
  }
  public static unsupportedMediaType(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.UNSUPPORTED_MEDIA_TYPE, message, options)
  }
  public static rangeNotSatisfiable(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.RANGE_NOT_SATISFIABLE, message, options)
  }
  public static expectationFailed(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.EXPECTATION_FAILED, message, options)
  }
  public static teapot(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.TEAPOT, message, options)
  }
  public static badData(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.BAD_DATA, message, options)
  }
  public static locked(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.LOCKED, message, options)
  }
  public static failedDependency(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.FAILED_DEPENDENCY, message, options)
  }
  public static preconditionRequired(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.PRECONDITION_REQUIRED, message, options)
  }
  public static tooManyRequests(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.TOO_MANY_REQUESTS, message, options)
  }
  public static illegal(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.ILLEGAL, message, options)
  }
  public static badImplementation(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.BAD_IMPLEMENTATION, message, options)
  }
  public static internal(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, message, options)
  }

  public static notImplemented(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.NOT_IMPLEMENTED, message, options)
  }
  public static badGateway(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.BAD_GATEWAY, message, options)
  }
  public static serverUnavailable(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.SERVER_UNAVAILABLE, message, options)
  }
  public static gatewayTimeout(message?: string, options?: IHttpErrorOptions) {
    return new HttpError(HttpStatusCode.GATEWAY_TIMEOUT, message, options)
  }
  public status: number
  public code?: number
  public headers?: IHttpHeader
  constructor(statusCode: number, message?: string, options?:IHttpErrorOptions ) {
    super(message) // pretty json
    this.status = statusCode
    this.code = options?.code
    this.headers = options?.headers
  }
  public getRawHeader(): { [key: string]: string } | undefined {
    return toRawHeader(this)
  }
  public getBody() {
    const body: any = { code: this.code || this.status}
    if(this.message) {
      body.message  = this.message
    }
    return body
  }
}
