import { HttpStatusCode } from '../constants/HttpStatusCode'

export class HttpStatus {
  public statusCode: number = 200
  public body?: any
  constructor(statusCode: number, body?: any) {
    this.statusCode = statusCode
    this.body = body
  }
}

export const ok = (body?: any) => new HttpStatus(HttpStatusCode.OK, body)
export const redirect = (url: string, code: number = 302) => new HttpStatus(code, url)
