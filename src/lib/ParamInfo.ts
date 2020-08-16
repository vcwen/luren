import { Source } from '../decorators'
import { IJsSchema } from 'luren-schema'

export class ParamInfo {
  public name: string
  public source: Source
  public schema: IJsSchema
  public required: boolean = false
  public root: boolean = false
  public format?: string
  public mime?: string
  public desc?: string
  public default: any
  public example?: any
  constructor(name: string, source: Source, schema: IJsSchema, required: boolean) {
    this.name = name
    this.source = source
    this.schema = schema
    this.required = required
  }
}
