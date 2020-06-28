import { v4 as uuid } from 'uuid'
import { AuthenticationType, HttpHeader, MetadataKey } from '../constants'
import { ExecutionLevel } from '../constants/ExecutionLevel'
import { HttpException } from '../lib'
import { ExecutionContext } from '../lib/ExecutionContext'
import { getRequestParam } from '../lib/helper'
import { ModuleContext } from '../lib/ModuleContext'
import { INext } from '../types'
import { IProcessor, Processor } from './Processor'
import { isExpectedAuthenticator } from '../lib/utils'
import { List } from 'immutable'

export interface IAuthenticatorDescriptor {
  id: string
  name: string
  type: string
  description?: string
}

export interface IAuthenticator extends IProcessor {
  authenticate(execCtx: ExecutionContext): Promise<boolean | [boolean, string]>
  getDescriptor(): IAuthenticatorDescriptor
}
export abstract class Authenticator extends Processor implements IAuthenticator {
  public abstract type: string
  public description?: string
  public id: string
  public constructor(public name: string) {
    super()
    this.id = uuid()
  }
  public onMount(level: ExecutionLevel, moduleContext: ModuleContext) {
    switch (level) {
      case ExecutionLevel.ACTION: {
        const ctx = moduleContext as Required<ModuleContext>
        const authenticators: List<IAuthenticatorDescriptor> =
          Reflect.getOwnMetadata(
            MetadataKey.AUTHENTICATORS,
            ctx.controllerModule.controller,
            ctx.actionModule.action.name
          ) || List()
        Reflect.defineMetadata(
          MetadataKey.AUTHENTICATORS,
          authenticators.push(this.getDescriptor()),
          ctx.controllerModule.controller,
          ctx.actionModule.action.name
        )
        break
      }
      case ExecutionLevel.CONTROLLER: {
        const ctx = moduleContext as Required<Omit<ModuleContext, 'actionModule'>>
        const authenticators: List<IAuthenticatorDescriptor> =
          Reflect.getOwnMetadata(MetadataKey.AUTHENTICATORS, ctx.controllerModule.controller) || List()
        Reflect.defineMetadata(
          MetadataKey.AUTHENTICATORS,
          authenticators.push(this.getDescriptor()),
          ctx.controllerModule.controller
        )
        break
      }
      case ExecutionLevel.APP: {
        const ctx = moduleContext as Required<ModuleContext>
        const authenticators: List<IAuthenticatorDescriptor> =
          Reflect.getOwnMetadata(MetadataKey.AUTHENTICATORS, ctx.app) || List()
        Reflect.defineMetadata(MetadataKey.AUTHENTICATORS, authenticators.push(this.getDescriptor()), ctx.app)
        break
      }
    }
  }
  public async process(execCtx: ExecutionContext, next: INext) {
    const res = isExpectedAuthenticator(this.id, execCtx) ? await this.authenticate(execCtx) : true
    let valid = false
    let message: string | undefined
    if (Array.isArray(res)) {
      ;[valid, message] = res
    } else {
      valid = res
    }
    if (valid) {
      return next()
    } else {
      throw HttpException.unauthorized(message)
    }
  }
  public abstract getDescriptor(): IAuthenticatorDescriptor
  public abstract async authenticate(execCtx: ExecutionContext): Promise<boolean | [boolean, string]>
}

// tslint:disable-next-line: max-classes-per-file
export class APITokenAuthentication extends Authenticator {
  public type = AuthenticationType.API_TOKEN
  public key: string
  public source: string
  private _validate: (key: string) => Promise<boolean>
  constructor(
    validate: (key: string) => Promise<boolean>,
    options: {
      name?: string
      key: string
      source: string
      description?: string
    }
  ) {
    // tslint:disable-next-line: no-magic-numbers
    super(options.name || AuthenticationType.API_TOKEN)
    this.key = options.key
    this._validate = validate
    this.source = options.source
    this.description = options.description
  }
  public async authenticate(execCtx: ExecutionContext) {
    const token = getRequestParam(execCtx.httpContext.request, this.key, this.source)
    return token && (await this._validate(token))
  }
  public getDescriptor() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      key: this.key,
      source: this.source,
      description: this.description
    }
  }
}

// tslint:disable-next-line: max-classes-per-file
export class HTTPAuthentication extends Authenticator {
  public type = AuthenticationType.HTTP
  public readonly scheme: string = 'bearer'
  public format: string
  private _validate: (key: string) => Promise<boolean>
  constructor(
    validate: (key: string) => Promise<boolean>,
    options: {
      name?: string
      format?: string
      description?: string
    }
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
      type: this.type,
      scheme: this.scheme,
      format: this.format,
      description: this.description
    }
  }
}
