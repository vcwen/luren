import Debug from 'debug'
import { EventEmitter } from 'events'
import { IncomingMessage, ServerResponse } from 'http'
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { List, Map } from 'immutable'
import Keygrip from 'keygrip'
import Koa, { BaseContext, Context, Middleware } from 'koa'
import helmet from 'koa-helmet'
import mount from 'koa-mount'
import Router from 'koa-router'
import send, { SendOptions } from 'koa-send'
import _ from 'lodash'
import { Server } from 'net'
import Path from 'path'
import { MetadataKey } from './constants/MetadataKey'
import { ServiceIdentifier } from './constants/ServiceIdentifier'
import { IDataSource } from './datasource/LurenDataSource'
import { Injectable } from './decorators/Inject'
import AuthenticationProcessor from './lib/Authentication'
import { container } from './lib/container'
import './lib/DataTypes'
import { createController, loadControllersRouter } from './lib/helper'
import { getFileLoaderConfig, importModules, toMiddleware } from './lib/utils'
import BodyParser from './middleware/BodyParser'
import ErrorProcessor from './middleware/ErrorProcessor'
import { ISecuritySettings } from './types'
import { Constructor } from './types/Constructor'

const debug = Debug('luren')

export interface IKoa {
  proxy: boolean
  keys: string[] | Keygrip
  readonly context: BaseContext
  listen(port: number, hostname?: string): Promise<Server>
  callback(): (req: IncomingMessage | Http2ServerRequest, res: ServerResponse | Http2ServerResponse) => void
}

export interface IModuleLoaderConfig {
  path: string
  pattern?: { include?: RegExp; exclude?: RegExp }
  filter?: (dir: string, filename: string) => boolean
}
export interface IModuleLoaderOptions {
  disabled?: boolean
  path?: string
  base?: string
  pattern?: RegExp | { include?: RegExp; exclude?: RegExp }
  filter?: (dir: string, filename: string) => boolean
}

export type IPlugin = (luren: Luren) => void

export class Luren implements IKoa {
  private _prefix: string = ''
  private _workDir: string = process.cwd()
  private _koa: Koa
  private _router: Router
  private _bootConfig?: IModuleLoaderConfig
  private _controllers: List<Constructor<any>> = List()
  private _middlewareConfig?: IModuleLoaderConfig
  private _controllerConfig?: IModuleLoaderConfig
  private _modelConfig?: IModuleLoaderConfig
  private _dataSource: Map<string, IDataSource> = Map()
  private _httpServer?: Server
  private _securitySettings: ISecuritySettings = {}
  private _defaultBodyParser?: Middleware = toMiddleware(new BodyParser())
  private _eventEmitter: EventEmitter = new EventEmitter()

  constructor(options?: {
    bootOptions?: IModuleLoaderOptions
    middlewareOptions?: IModuleLoaderOptions
    controllerOptions?: IModuleLoaderOptions
    modelOptions?: IModuleLoaderOptions
  }) {
    this._koa = new Koa()
    this._koa.use(helmet())
    this._koa.use(new ErrorProcessor(this._eventEmitter).toMiddleware())
    this._router = new Router()
    options = options || {}
    this._bootConfig = getFileLoaderConfig(options.bootOptions, 'boot')
    this._middlewareConfig = getFileLoaderConfig(options.middlewareOptions, 'middleware')
    this._modelConfig = getFileLoaderConfig(options.modelOptions, 'models')
    this._controllerConfig = getFileLoaderConfig(options.controllerOptions, 'controllers')
  }

  public get proxy() {
    return this._koa.proxy
  }
  public set proxy(enabled: boolean) {
    this._koa.proxy = enabled
  }

  public get keys() {
    return this._koa.keys as string[]
  }
  public set keys(keys: string[] | Keygrip) {
    this._koa.keys = keys
  }

  public get context() {
    return this._koa.context
  }

  public callback() {
    return this._koa.callback()
  }

  public setPrefix(value: string) {
    this._prefix = value
    this._router.prefix(this._prefix)
  }
  public getPrefix() {
    return this._prefix
  }
  public onError(onError: (err: any, ctx?: Context) => any) {
    this._eventEmitter.on('error', onError)
  }

  public setDefaultAuthentication(auth: AuthenticationProcessor) {
    this._securitySettings.authentication = auth
  }
  public setDefaultBodyParser(bodyParser?: Middleware) {
    this._defaultBodyParser = bodyParser
  }

  public setWorkDirectory(dir: string) {
    this._workDir = dir
  }

  public async listen(port: number, hostname?: string) {
    try {
      await this._initialize()
      await this._loadBootModules()
      return await new Promise<Server>((resolve) => {
        const server = this._koa.listen(port, hostname, () => {
          resolve(server)
        })
        this._httpServer = server
      })
    } catch (err) {
      throw err
    }
  }

  public close() {
    if (this._httpServer) {
      this._httpServer.close()
    }
  }

  public getControllers() {
    return this._controllers
  }

  public addDataSource(name: string, dataSource: IDataSource) {
    this._dataSource = this._dataSource.set(name, dataSource)
  }

  public setDefaultDataSource(dataSource: IDataSource) {
    this._dataSource = this._dataSource.set('default', dataSource)
  }

  public setBootConfig(config: IModuleLoaderOptions) {
    this._bootConfig = getFileLoaderConfig(config, 'boot')
  }
  public setControllerConfig(config: IModuleLoaderOptions) {
    this._controllerConfig = getFileLoaderConfig(config, 'controllers')
  }
  public getSecuritySettings() {
    return this._securitySettings
  }
  public plugin(...plugins: IPlugin[]) {
    for (const p of plugins) {
      p(this)
    }
  }

  public use(middleware: Koa.Middleware): Luren
  public use(path: string, middleware: Koa.Middleware): Luren
  public use(...args: any[]) {
    if (args.length === 1) {
      this._koa.use(args[0])
    } else {
      this._koa.use(mount(args[0], args[1]))
    }
    return this
  }

  public serve(path: string, options: SendOptions): void
  public serve(options: SendOptions): void
  public serve(...args: any[]): void {
    let path = '/'
    let options: SendOptions
    if (args.length === 2) {
      ;[path, options] = args
    } else if (args.length === 1) {
      ;[options] = args
    } else {
      throw new Error('Invalid arguments')
    }
    this._koa.use(
      mount(path, async (ctx) => {
        await send(ctx, ctx.path, options)
      })
    )
  }

  private async _initialize() {
    if (this._defaultBodyParser) {
      this._koa.use(this._defaultBodyParser)
    }
    await this._loadModelModules()
    await this._loadMiddleware()
    const router = this._router
    await this._loadControllerModules()
    this._loadControllers()
    this._koa.use(router.routes()).use(router.allowedMethods())
  }
  private async _loadMiddleware() {
    const config = this._middlewareConfig
    if (!config) {
      return
    }
    try {
      const modules = await importModules(this._workDir, config)
      for (const module of modules) {
        let middleware = module.default
        if (!middleware) {
          continue
        }
        if (!Array.isArray(middleware)) {
          middleware = [middleware]
        }
        for (let m of middleware) {
          if (m && typeof m.toMiddleware === 'function') {
            m = m.toMiddleware()
          }
          if (typeof m === 'function') {
            this._koa.use(m)
          }
        }
      }
    } catch (err) {
      if (err.code === 'ENOENT' && err.syscall === 'scandir' && err.path === Path.resolve(this._workDir, config.path)) {
        // tslint:disable-next-line:no-console
        console.warn('No default middleware directory, skip loading middleware')
      } else {
        throw err
      }
    }
  }

  private async _loadBootModules() {
    const config = this._bootConfig
    if (!config) {
      return
    }
    try {
      await importModules(this._workDir, config)
    } catch (err) {
      if (err.code === 'ENOENT' && err.syscall === 'scandir' && err.path === Path.resolve(this._workDir, config.path)) {
        // tslint:disable-next-line:no-console
        console.warn('No boot directory, skip loading boot modules')
      } else {
        throw err
      }
    }
  }
  private async _loadControllerModules() {
    const config = this._controllerConfig
    if (!config) {
      return
    }
    try {
      const modules = await importModules(this._workDir, config)
    } catch (err) {
      if (err.code === 'ENOENT' && err.syscall === 'scandir' && err.path === Path.resolve(this._workDir, config.path)) {
        // tslint:disable-next-line:no-console
        console.warn('No controllers directory, skip loading controller modules')
      } else {
        throw err
      }
    }
  }
  private async _loadModelModules() {
    const config = this._modelConfig
    if (!config) {
      return
    }
    try {
      const modules = await importModules(this._workDir, config)
      for (const module of modules) {
        const model = module.default
        if (!model) {
          continue
        }
        for (const ds of this._dataSource.values()) {
          ds.loadSchema(model)
        }
      }
    } catch (err) {
      if (err.code === 'ENOENT' && err.syscall === 'scandir' && err.path === Path.resolve(this._workDir, config.path)) {
        // tslint:disable-next-line:no-console
        console.warn('No models directory, skip loading model modules')
      } else {
        throw err
      }
    }
  }
  private _loadControllers() {
    const controllers = container.getAll<object>(ServiceIdentifier.CONTROLLER)
    const ctrls = controllers.map((ctrl) => {
      return createController(this, ctrl)
    })
    const router = loadControllersRouter(List(ctrls))
    this._router.use(router.routes())
  }
}
