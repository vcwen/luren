import { HttpStatusCode } from '../constants/HttpStatusCode'

export class HttpResponse {
  public status: number = 200
  public headers?: { [key: string]: string }
  public body?: any
  constructor(statusCode: number, body?: any, headers?: { [key: string]: string }) {
    this.status = statusCode
    this.body = body
    this.headers = headers
  }
}

export const OK = (body?: any) => new HttpResponse(HttpStatusCode.OK, body)
export const redirect = (url: string, status: number = 302) => new HttpResponse(status, url)
