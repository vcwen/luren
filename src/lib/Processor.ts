import { toMiddleware } from './utils'

export interface IProcessor {
  name?: string
  description?: string
  process(...args: any[]): Promise<any>
}
export default abstract class Processor implements IProcessor {
  public name?: string
  public description?: string
  public abstract async process(...args: any[]): Promise<any>
  public toMiddleware() {
    return toMiddleware(this)
  }
}
