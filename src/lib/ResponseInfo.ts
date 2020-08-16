import { HttpStatusCode } from '../constants'
import { IJsSchema } from 'luren-schema'

export class ResponseInfo {
  public status: number = HttpStatusCode.OK
  public desc?: string
  public schema: IJsSchema
  public required: boolean
  public headers?: { [name: string]: any }
  public example?: any

  constructor(status: number, schema: IJsSchema, required: boolean, desc?: string) {
    this.status = status
    this.schema = schema
    this.required = required
    if (desc) {
      this.desc = desc
    }
  }
}
