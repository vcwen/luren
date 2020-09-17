import { Context } from 'koa'
import { ModuleContext } from './ModuleContext'
export class ExecutionContext {
  constructor(public httpContext: Context, public moduleContext?: ModuleContext) {}
}
