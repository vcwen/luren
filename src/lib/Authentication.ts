import Boom from 'boom'
import { Context } from 'koa'
import uid from 'uid-safe'
import { AuthenticationType } from '../constants'
import { getRequestParam } from './helper'
import Processor from './Processor'

export default abstract class AuthenticationProcessor extends Processor {
  public name: string
  public abstract type: string
  constructor(name: string) {
    super()
    this.name = name
  }
}

// tslint:disable-next-line: max-classes-per-file
export class APITokenAuthentication extends AuthenticationProcessor {
  public type = AuthenticationType.API_TOKEN
  public key: string
  public source: string
  private validate: (key: string) => Promise<boolean>
  constructor(options: {
    name?: string
    key: string
    source: string
    validate: (key: string) => Promise<boolean>
    description?: string
  }) {
    // tslint:disable-next-line: no-magic-numbers
    super(options.name || 'API_TOKEN_' + uid.sync(5))
    this.key = options.key
    this.validate = options.validate
    this.source = options.source
    this.description = options.description
  }
  public async process(context: Context) {
    const token = getRequestParam(context.request, this.key, this.source)
    if (!token || !(await this.validate(token))) {
      throw Boom.unauthorized(`${this.key} is invalid in ${this.source}`)
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
export class NoneAuthentication extends AuthenticationProcessor {
  public type = AuthenticationType.NONE
  constructor() {
    super('NO_AUTHENTICATION')
  }
  public async process() {
    return undefined
  }
}
