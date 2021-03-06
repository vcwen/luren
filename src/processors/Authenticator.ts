import { AuthenticationType, HttpHeader } from '../constants'
import { HttpException } from '../lib'
import { ExecutionContext } from '../lib/ExecutionContext'
import { getRequestParam } from '../lib/helper'
import { IProcessor } from './Processor'
import { Guard } from './Guard'

export interface IAuthenticatorDescriptor {
  id: string
  name: string
  authenticationType: string
  description?: string
}

export interface IAuthenticator extends IProcessor {
  authenticate(execCtx: ExecutionContext): Promise<boolean>
  getDescriptor(): IAuthenticatorDescriptor
}
export abstract class Authenticator extends Guard implements IAuthenticator {
  public type: string = 'AUTHENTICATOR'
  public abstract authenticationType: string
  public description?: string
  public constructor(public name: string) {
    super()
  }
  public async validate(execCtx: ExecutionContext) {
    return this.authenticate(execCtx)
  }
  public abstract getDescriptor(): IAuthenticatorDescriptor
  public abstract async authenticate(execCtx: ExecutionContext): Promise<boolean>
}

// tslint:disable-next-line: max-classes-per-file
export class APITokenAuthenticator extends Authenticator {
  public authenticationType = AuthenticationType.API_TOKEN
  public key: string
  public source: string
  private _validate: (key: string) => Promise<boolean>
  constructor(
    validate: (token: string) => Promise<boolean>,
    options: {
      name?: string
      key?: string
      source?: 'query' | 'header' | 'body'
      description?: string
    } = {}
  ) {
    super(options?.name || AuthenticationType.API_TOKEN)
    this.key = options.key ?? 'access_token'
    this._validate = validate
    this.source = options.source ?? 'query'
    this.description = options.description
  }
  public async authenticate(execCtx: ExecutionContext) {
    const token = getRequestParam(execCtx.httpContext.request, this.key, this.source)
    if (token && (await this._validate(token))) {
      return true
    } else {
      throw HttpException.unauthorized(`invalid ${this.key}:${token} `)
    }
  }
  public getDescriptor() {
    return {
      id: this.id,
      name: this.name,
      authenticationType: this.authenticationType,
      key: this.key,
      source: this.source,
      description: this.description
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
export class HttpAuthenticator extends Authenticator {
  public authenticationType = AuthenticationType.HTTP
  public readonly scheme: string = 'bearer'
  public format: string
  private _validate: (key: string) => Promise<boolean>
  constructor(
    validate: (key: string) => Promise<boolean>,
    options: {
      name?: string
      format?: string
      description?: string
    } = {}
  ) {
    // tslint:disable-next-line: no-magic-numbers
    super(options.name || 'HTTP')
    this.format = options.format || 'JWT'
    this._validate = validate
    this.description = options.description
  }
  public async authenticate(execCtx: ExecutionContext) {
    let token = getRequestParam(execCtx.httpContext.request, 'Authorization', 'header')
    if (this.scheme === 'bearer') {
      const regex = /bearer\s+(\S+)/i
      const match = regex.exec(token)
      if (match) {
        token = match[1]
      } else {
        throw HttpException.unauthorized(`Invalid bearer token:${token}`, {
          headers: { [HttpHeader.WWW_Authenticate]: this.scheme }
        })
      }
    }
    if (await this._validate(token)) {
      return true
    } else {
      throw HttpException.unauthorized(`Token:${token} is invalid`, {
        headers: { [HttpHeader.WWW_Authenticate]: this.scheme }
      })
    }
  }
  public getDescriptor() {
    return {
      id: this.id,
      name: this.name,
      authenticationType: this.authenticationType,
      scheme: this.scheme,
      format: this.format,
      description: this.description
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
export class NOAuthenticator extends Authenticator {
  public authenticationType = AuthenticationType.NONE
  public async authenticate() {
    return true
  }
  public getDescriptor() {
    return {
      id: this.id,
      name: this.name,
      authenticationType: this.authenticationType
    }
  }
}
