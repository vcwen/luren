export interface IAuthentication {
  authenticate(...args: any[]): Promise<boolean>
}
export default abstract class Authentication implements IAuthentication {
  public abstract async authenticate(...args: any[]): Promise<boolean>
}
