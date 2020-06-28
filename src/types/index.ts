export type INext = () => Promise<any>
export type IAuthenticate = (...args: any[]) => Promise<boolean>
export type IAuthorize = (...args: any[]) => Promise<boolean>
