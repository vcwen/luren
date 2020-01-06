import { Fields, Files, IncomingForm } from 'formidable'
import { promises as fs } from 'fs'
import headerCase from 'header-case'
import { List } from 'immutable'
import { Context } from 'koa'
import _ from 'lodash'
import Path from 'path'
import 'reflect-metadata'
import { MetadataKey } from '../constants'
import { ParamMetadata } from '../decorators'
import { IModuleLoaderConfig, IModuleLoaderOptions } from '../Luren'
import { INext } from '../types'
import { getParams } from './helper'
import { IHttpResponse } from './HttpResponse'
import { IProcessor } from './Processor'

export const importModules = async (workDir: string, config: IModuleLoaderConfig) => {
  const dir = Path.isAbsolute(config.path) ? config.path : Path.resolve(workDir, config.path)
  const files = await fs.readdir(dir)
  const pattern = config.pattern
  const filter = config.filter
  const defaultExcludePattern = /(^\.)|(\.d\.ts$)/
  const defaultIncludePattern = /\.[t|j]s$/
  const modules = [] as any[]
  for (const file of files) {
    const stat = await fs.lstat(Path.resolve(dir, file))
    if (stat.isDirectory()) {
      await importModules(workDir, { path: Path.resolve(dir, file), pattern })
    } else {
      if ((pattern && pattern.exclude && pattern.exclude.test(file)) || defaultExcludePattern.test(file)) {
        continue
      }
      if (
        defaultIncludePattern.test(file) &&
        (!pattern || !pattern.include || pattern.include.test(file)) &&
        (!filter || filter(dir, file))
      ) {
        const module = await import(Path.resolve(dir, file))
        modules.push(module)
      }
    }
  }
  return modules
}

export const getFileLoaderConfig = (options: IModuleLoaderOptions = {}, defaultPath: string) => {
  if (options.disabled) {
    return
  }
  const path = options.path || defaultPath
  const conf: IModuleLoaderConfig = {
    path
  }
  if (options.pattern) {
    conf.pattern = {}
    if (options.pattern instanceof RegExp) {
      conf.pattern.include = options.pattern
    } else {
      if (options.pattern.include) {
        conf.pattern.include = options.pattern.include
      }
      if (options.pattern.exclude) {
        conf.pattern.include = options.pattern.include
      }
    }
  }
  if (options.filter) {
    conf.filter = options.filter
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

export const toMiddleware = (processor: IProcessor) => {
  return async function middleware(ctx: Context, next: INext) {
    const paramsMetadata: List<ParamMetadata> = Reflect.getMetadata(MetadataKey.PARAMS, processor, 'process') || List()

    let nextCalled = false
    const wrappedNext = async () => {
      nextCalled = true
      return next()
    }
    let res = false
    if (paramsMetadata.isEmpty()) {
      res = await processor.process(ctx, wrappedNext)
    } else {
      const args = getParams(ctx, wrappedNext, paramsMetadata)
      res = await processor.process(...args)
    }
    if (!res && !nextCalled) {
      return next()
    }
  }
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
