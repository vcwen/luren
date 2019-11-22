import Processor from './Processor'

export default abstract class AuthorizationProcessor extends Processor {
  public name: string
  constructor(name: string, description?: string) {
    super()
    this.name = name
    this.description = description
  }
  public abstract async process(...args: any[]): Promise<void>
}
