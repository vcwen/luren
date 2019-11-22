import AuthenticationProcessor from '../lib/Authentication'
import AuthorizationProcessor from '../lib/Authorization'

export type IProcess = (...args: any[]) => Promise<any>
export type INext = () => Promise<any>
export type IAuthenticate = (...args: any[]) => Promise<boolean>
export type IAuthorize = (...args: any[]) => Promise<boolean>
export interface ISecuritySettings {
  authentication?: AuthenticationProcessor
  authorization?: AuthorizationProcessor
}
