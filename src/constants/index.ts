export { HttpStatusCode } from './HttpStatusCode'
export { HttpMethod } from './HttpMethod'
export { MetadataKey } from './MetadataKey'
export { HttpHeader } from './HttpHeader'
export { ExecutionLevel } from './ExecutionLevel'
export { ParamSource } from './ParamSource'

export enum AuthenticationType {
  NONE = 'NONE',
  API_TOKEN = 'API_TOKEN',
  HTTP = 'HTTP'
}

export enum Scope {
  SINGLETON = 'SINGLETON',
  TRANSIENT = 'TRANSIENT',
  REQUEST = 'REQUEST'
}
