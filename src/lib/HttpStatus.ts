import { HttpStatusCode } from '../constants/HttpStatusCode'

export class HttpStatus {
  public statusCode: number = 200
  public redirectUrl?: string
  public body?: any
  constructor(statusCode: number, body?: any, redirectUrl?: string) {
    this.statusCode = statusCode
    this.body = body
    this.redirectUrl = redirectUrl
  }
}

export const ok = (body?: any) => new HttpStatus(HttpStatusCode.OK, body)
export const redirect = (url: string, code: number = 302, body?: any) => new HttpStatus(code, body, url)
