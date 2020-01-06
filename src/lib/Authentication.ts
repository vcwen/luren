import { Context } from 'koa'
import uid from 'uid-safe'
import { AuthenticationType } from '../constants'
import { HttpHeader } from '../constants/HttpHeader'
import { InHeader } from '../decorators/Param'
import { getRequestParam } from './helper'
import { HttpError } from './HttpError'
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
      throw HttpError.unauthorized(`${this.key} is invalid in ${this.source}`)
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
export class HTTPAuthentication extends AuthenticationProcessor {
  public type = AuthenticationType.HTTP
  public scheme: string = 'bearer'
  public bearerFormat: string
  private _validate: (key: string) => Promise<boolean>
  constructor(options: {
    name?: string
    bearerFormat?: string
    validate: (key: string) => Promise<boolean>
    description?: string
  }) {
    // tslint:disable-next-line: no-magic-numbers
    super(options.name || 'HTTP_' + uid.sync(5))
    this.bearerFormat = options.bearerFormat || 'JWT'
    this._validate = options.validate
    this.description = options.description
  }
  public async process(@InHeader('authorization', 'string') token: string) {
    if (this.scheme === 'bearer') {
      const regex = /bearer\s+(\S+)/i
      const match = regex.exec(token)
      if (match) {
        token = match[1]
      } else {
        throw HttpError.unauthorized(`Invalid bearer token:${token}`, {
          headers: { [HttpHeader.WWW_Authenticate]: this.scheme }
        })
      }
    }

    if (!(await this._validate(token))) {
      throw HttpError.unauthorized(`Token:${token} is invalid`, {
        headers: { [HttpHeader.WWW_Authenticate]: this.scheme }
      })
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
    return
  }
}
