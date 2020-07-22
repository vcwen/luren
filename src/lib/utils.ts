import { Fields, Files, IncomingForm } from 'formidable'
import glob from 'globby'
import { headerCase } from 'header-case'
import { Context } from 'koa'
import _ from 'lodash'
import Path from 'path'
import 'reflect-metadata'
import { IModuleLoaderConfig, IModuleLoaderOptions } from '../Luren'
import { IHttpResponse } from './HttpResponse'
import { Constructor } from '../types/Constructor'
import { METADATA_KEY } from 'inversify'
import { getContainer } from './container'
import { Injectable } from '../decorators/Inject'
import { Scope, HttpStatusCode } from '../constants'
import { Middleware } from './Middleware'

export const importModules = async (workDir: string, config: IModuleLoaderConfig) => {
  const dir = Path.isAbsolute(config.path) ? config.path : Path.resolve(workDir, config.path)
  const pattern = config.pattern ?? '*'
  const ignore = config.ignore || []
  const files = await glob(pattern, {
    cwd: dir,
    ignore: ['*.d.ts', ...ignore],
    expandDirectories: { extensions: ['js', 'ts'] }
  })
  const modules = [] as any[]
  for (const file of files) {
    const module = await import(Path.resolve(dir, file))
    modules.push(module)
  }
  return modules
}

export const getFileLoaderConfig = (options: IModuleLoaderOptions = {}, defaultPath: string) => {
  const path = options.path || defaultPath
  const conf: IModuleLoaderConfig = {
    path,
    pattern: options.pattern ?? '*'
  }
  if (options.ignore) {
    conf.ignore = Array.isArray(options.ignore) ? options.ignore : [options.ignore]
  }
  return conf
}

export const parseFormData = async (ctx: Context) => {
  const form = new IncomingForm()
  return new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
    form.parse(ctx.req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      resolve({ fields, files })
    })
  })
}

export const normalizeHeaderCase = (headers: { [name: string]: string }) => {
  const normalizedHeaders: { [name: string]: string } = {}
  const props = Object.getOwnPropertyNames(headers)
  for (const prop of props) {
    let header = prop.toLowerCase()
    switch (header) {
      case 'etag':
        header = 'ETag'
        break
      case 'dnt':
        header = 'DNT'
        break
      case 'te':
        header = 'TE'
        break
      case 'www-authenticate':
        header = 'WWW-Authenticate'
        break
      case 'x-dns-prefetch-control':
        header = 'X-DNS-Prefetch-Control'
        break
      case 'x-xss-protection':
        header = 'X-XSS-Protection'
        break
      default:
        header = headerCase(prop)
    }
    normalizedHeaders[header] = headers[prop]
  }
  return normalizedHeaders
}

export const toRawHeader = (response: IHttpResponse): { [key: string]: string } | undefined => {
  if (response.headers) {
    const header: any = {}
    for (const prop of Object.keys(response.headers)) {
      if (response.headers[prop] !== undefined && response.headers[prop] !== null) {
        if (typeof response.headers[prop] === 'string') {
          Reflect.set(header, prop, response.headers[prop])
        } else {
          Reflect.set(header, prop, JSON.stringify(response.headers[prop]))
        }
      }
    }
    return header
  }
}

export const isInjectable = (constructor: Constructor) => {
  return Reflect.hasOwnMetadata(METADATA_KEY.PARAM_TYPES, constructor)
}

export const getClassInstance = <T = any>(constructor: Constructor) => {
  if (!isInjectable(constructor)) {
    Injectable({ scope: Scope.SINGLETON })(constructor)
  }
  return getContainer().get<T>(constructor)
}

export const isLurenMiddleware = (val: any): val is Middleware => {
  return val instanceof Middleware
}

export const shouldHaveResponseBody = (statusCode: number) => {
  const statusWithoutBody = [HttpStatusCode.NO_CONTENT]
  return !statusWithoutBody.includes(statusCode)
}
