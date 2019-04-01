import Ajv from 'ajv'
import Boom from 'boom'
import Debug from 'debug'
import { List, Map } from 'immutable'
import { Container } from 'inversify'
import Koa from 'koa'
import Router, { IMiddleware, IRouterContext } from 'koa-router'
import _ from 'lodash'
import { Server } from 'net'
import Path from 'path'
import { HttpStatusCode, MetadataKey } from './constants'
import { ServiceIdentifier } from './constants/ServiceIdentifier'
import { IDatasource } from './datasource/LurenDatasource'
import { ParamMetadata, ResponseMetadata, RouteMetadata } from './decorators'
import { getParams } from './lib/Helper'
import { HttpStatus } from './lib/HttpStatus'
import { getFileLoaderConfig, importModules } from './lib/utils'
import { parseFormData, transform } from './lib/utils'
const debug = Debug('luren')
const ajv = new Ajv()

export interface IModuleLoaderConfig {
  path: string
  pattern?: { include?: RegExp; exclude?: RegExp }
  filter?: (dir: string, filename: string) => boolean
}
export interface IModuleLoaderOptions {
  path: string
  base?: string
  pattern?: RegExp | { include?: RegExp; exclude?: RegExp }
  filter?: (dir: string, filename: string) => boolean
}

export type IPlugin = (luren: Luren) => void

export class Luren {
  private _prefix: string = '/api'
  private _workDir: string = process.cwd()
  private _koa: Koa
  private _router: Router
  private _container?: Container
  private _bootConfig?: IModuleLoaderConfig
  private _controllers: List<object> = List()
  private _middlewareConfig?: IModuleLoaderConfig
  private _controllerConfig?: IModuleLoaderConfig
  private _modelConfig?: IModuleLoaderConfig
  private _datasource: Map<string, IDatasource> = Map()
  private _onError?: (err: any) => void
  constructor(options?: {
    container?: Container
    bootOptions?: IModuleLoaderOptions
    controllerOptions?: IModuleLoaderOptions
    modelOptions?: IModuleLoaderOptions
  }) {
    this._koa = new Koa()
    this._router = new Router({ prefix: this._prefix })
    if (options) {
      this._container = options.container
      if (options.bootOptions) {
        this._bootConfig = getFileLoaderConfig(options.bootOptions)
      }
      if (options.controllerOptions) {
        this._controllerConfig = getFileLoaderConfig(options.controllerOptions)
      }
    }
  }
  public setPrefix(value: string) {
    this._prefix = value
    this._router.prefix(this._prefix)
  }
  public getPrefix() {
    return this._prefix
  }
  public onError(onError: (err: any) => void) {
    this._onError = onError
  }
  public setWorkDirectory(dir: string) {
    this._workDir = dir
  }

  public async listen(port: number) {
    try {
      await this._initialize()
      await this._loadBootModules()
      return await new Promise<Server>((resolve) => {
        const server = this._koa.listen(port, () => {
          resolve(server)
        })
      })
    } catch (err) {
      throw err
    }
  }
  public getRouter() {
    return this._router
  }

  public getKoa() {
    return this._koa
  }

  public getControllers() {
    return this._controllers
  }

  public addDatasource(name: string, datasource: IDatasource) {
    this._datasource = this._datasource.set(name, datasource)
  }

  public setDefaultDatasource(datasource: IDatasource) {
    this._datasource = this._datasource.set('default', datasource)
  }

  public registerControllers(...controllers: object[]) {
    this._controllers = this._controllers.concat(controllers)
  }
  public setBootConfig(config: IModuleLoaderOptions) {
    this._bootConfig = getFileLoaderConfig(config)
  }
  public setControllerConfig(config: IModuleLoaderOptions) {
    this._bootConfig = getFileLoaderConfig(config)
  }
  public plugin(...plugins: IPlugin[]) {
    for (const plugin of plugins) {
      plugin(this)
    }
  }
  public _createAction(controller: object, propKey: string) {
    const paramsMetadata: List<ParamMetadata> =
      Reflect.getOwnMetadata(MetadataKey.PARAMS, Reflect.getPrototypeOf(controller), propKey) || List()
    const action = async (ctx: IRouterContext, next?: any) => {
      try {
        if (!ctx.disableFormParser && ctx.is('multipart/form-data')) {
          const { fields, files } = await parseFormData(ctx)
          const request: any = ctx.request
          request.body = fields
          request.files = files
        }
        const args = getParams(ctx, paramsMetadata)
        await this._processRoute(ctx, controller, propKey, args.toArray())
        if (next) {
          await next()
        }
      } catch (err) {
        if (Boom.isBoom(err)) {
          if (err.isServer) {
            throw err
          } else {
            ctx.status = err.output.statusCode
            const response = !_.isEmpty(err.output.payload.attributes)
              ? err.output.payload.attributes
              : err.output.payload.message
            const resultMetadataMap: Map<number, ResponseMetadata> =
              Reflect.getMetadata(MetadataKey.RESPONSE, controller, propKey) || Map()
            const resMetadata = resultMetadataMap.get(err.output.statusCode)
            if (resMetadata && resMetadata.strict) {
              if (ajv.validate(resMetadata.schema, response)) {
                ctx.body = transform(response, resMetadata.schema, resMetadata.schema)
              } else {
                ctx.body = response
              }
            } else {
              ctx.body = response
            }
          }
        } else {
          throw err
        }
      }
    }
    return action
  }
  private async _initialize() {
    await this._loadModelModules()
    await this._loadMiddleware()
    const router = this._router
    await this._loadControllerModules()
    this._loadControllers(this, this._controllers)
    this._koa.use(router.routes()).use(router.allowedMethods())
  }
  private async _loadMiddleware() {
    const config: IModuleLoaderConfig = this._middlewareConfig || { path: 'middleware' }
    try {
      const modules = await importModules(this._workDir, config)
      for (const module of modules) {
        const middleware = module.default
        if (Array.isArray(middleware)) {
          for (const m of middleware) {
            this._koa.use(m)
          }
        } else {
          this._koa.use(middleware)
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
    const config: IModuleLoaderConfig = this._bootConfig || { path: 'boot' }
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
    const config: IModuleLoaderConfig = this._controllerConfig || { path: 'controllers' }
    try {
      await importModules(this._workDir, config)
    } catch (err) {
      if (err.code === 'ENOENT' && err.syscall === 'scandir' && err.path === Path.resolve(this._workDir, config.path)) {
        // tslint:disable-next-line:no-console
        console.warn('No controllers directory, skip loading controller modules')
      } else {
        throw err
      }
    }
    if (this._container) {
      const ctrls = this._container.getAll(ServiceIdentifier.CONTROLLER)
      this._controllers = this._controllers.concat(ctrls)
    }
  }
  private async _loadModelModules() {
    const config: IModuleLoaderConfig = this._modelConfig || { path: 'models' }
    try {
      const modules = await importModules(this._workDir, config)
      for (const module of modules) {
        const model = module.default
        for (const ds of this._datasource.values()) {
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
  private _applyCtrlMiddleware(router: Router, middleware: List<IMiddleware>) {
    middleware.forEach((mw) => {
      router.use(mw)
    })
  }
  private _processRoute = async (ctx: IRouterContext, controller: any, propKey: string, args: any[]) => {
    const response = await controller[propKey].apply(controller, args)
    if (response instanceof HttpStatus) {
      ctx.status = response.statusCode
      switch (response.statusCode) {
        case HttpStatusCode.MOVED_PERMANENTLY:
        case HttpStatusCode.FOUND:
          return ctx.redirect(response.body)
        default:
          ctx.body = response.body
      }
    } else {
      const resultMetadataMap: Map<number, ResponseMetadata> =
        Reflect.getMetadata(MetadataKey.RESPONSE, controller, propKey) || Map()
      const resMetadata = resultMetadataMap.get(HttpStatusCode.OK)
      if (resMetadata && resMetadata.strict) {
        if (ajv.validate(resMetadata.schema, response)) {
          ctx.body = transform(response, resMetadata.schema, resMetadata.schema)
        } else {
          throw new Error(ajv.errorsText())
        }
      } else {
        ctx.body = response
      }
    }
  }

  private _createRoute(controller: object, propKey: string, routeMetadata: RouteMetadata) {
    const action = this._createAction(controller, propKey)
    const middleware: List<IMiddleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, controller, propKey) || List()
    return {
      method: routeMetadata.method.toLowerCase(),
      path: routeMetadata.path,
      action,
      middleware
    }
  }

  private _createRoutes(controller: object) {
    const routeMetadataMap: Map<string, RouteMetadata> = Reflect.getMetadata(MetadataKey.ROUTES, controller)
    return routeMetadataMap
      .map((routeMetadata, prop) => {
        return this._createRoute(controller, prop, routeMetadata)
      })
      .toList()
  }
  private _createController(ctrl: object) {
    const router: any = new Router()
    const ctrlMiddleware: List<IMiddleware> = Reflect.getMetadata(MetadataKey.MIDDLEWARE, ctrl) || List()
    this._applyCtrlMiddleware(router, ctrlMiddleware)
    const routes = this._createRoutes(ctrl)
    routes.forEach((route) => {
      const action = async (ctx: Router.IRouterContext, next?: any) => {
        try {
          await route.action(ctx, next)
        } catch (err) {
          debug(err)
          ctx.status = HttpStatusCode.INTERNAL_SERVER_ERROR
          if (this._onError) {
            this._onError(err)
          } else {
            // tslint:disable-next-line:no-console
            console.error(err)
          }
        }
      }
      if (!route.middleware.isEmpty()) {
        router[route.method](route.path, ...route.middleware, action)
      } else {
        router[route.method](route.path, action)
      }
    })
    return router
  }
  private _loadControllers = (luren: Luren, controllers: List<object>) => {
    const router = luren.getRouter()
    controllers.forEach((item) => {
      const ctrl = this._createController(item)
      router.use(ctrl.routes(), ctrl.allowedMethods())
    })
    return router
  }
}
