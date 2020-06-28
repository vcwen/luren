import { HttpStatusCode } from '../constants/HttpStatusCode'
import IHttpHeader from '../types/HttpHeader'
import { toRawHeader } from './utils'

export interface IHttpResponse {
  status: number
  headers?: IHttpHeader
  body?: any
  getRawHeader(): { [key: string]: string } | undefined
}
export class HttpResponse implements IHttpResponse {
  public status: number = 200
  public headers?: IHttpHeader
  public body?: any
  constructor(statusCode: number, body?: any, headers?: IHttpHeader) {
    this.status = statusCode
    this.body = body
    this.headers = headers
  }
  public getRawHeader(): { [key: string]: string } | undefined {
    return toRawHeader(this)
  }
}

export const ok = (body?: any) => new HttpResponse(HttpStatusCode.OK, body)
export const redirect = (url: string, status: number = 302) => new HttpResponse(status, url)
// do not handle the response
export const ignore = () => new HttpResponse(0)
