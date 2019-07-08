import { Fields, Files, IncomingForm } from 'formidable'
import { promises as fs } from 'fs'
import { List } from 'immutable'
import { Context } from 'koa'
import _ from 'lodash'
import Path from 'path'
import 'reflect-metadata'
import { MetadataKey } from '../constants'
import { ParamMetadata } from '../decorators'
import { IModuleLoaderConfig, IModuleLoaderOptions } from '../Luren'
import { IMiddlewareAdaptable, INext } from '../types'
import { getParams } from './helper'

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
        break
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

export const adaptMiddleware = <T>(
  processor: IMiddlewareAdaptable<T>,
  resultHandler?: (res: T, ctx: Context, next: INext) => Promise<any>
) => {
  return async function middleware(ctx: Context, next: INext) {
    const paramsMetadata: List<ParamMetadata> =
      Reflect.getOwnMetadata(MetadataKey.PARAMS, middleware, 'process') || List()
    let result: any
    if (paramsMetadata.isEmpty()) {
      result = await processor.process(ctx, next)
    } else {
      const args = getParams(ctx, paramsMetadata)
      result = await processor.process(...args)
    }
    if (resultHandler) {
      return resultHandler(result, ctx, next)
    } else {
      return result
    }
  }
}
