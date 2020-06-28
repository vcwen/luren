import { ParameterizedContext } from 'koa'
import { ModuleContext } from './ModuleContext'
export class ExecutionContext {
  constructor(public httpContext: ParameterizedContext, public moduleContext?: ModuleContext) {}
}
