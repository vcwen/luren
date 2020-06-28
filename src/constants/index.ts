export { HttpStatusCode } from './HttpStatusCode'
export { HttpMethod } from './HttpMethod'
export { MetadataKey } from './MetadataKey'
export { HttpHeader } from './HttpHeader'
export { AuthenticationScope } from './AuthenticationScope'
export { ExecutionLevel } from './ExecutionLevel'
export { ParamSource } from './ParamSource'

export enum AuthenticationType {
  NONE = 'NONE',
  CUSTOM = 'CUSTOM',
  COMPOSED = 'COMPOSED',
  API_TOKEN = 'API_TOKEN',
  HTTP = 'HTTP'
}

export enum Scope {
  SINGLETON = 'SINGLETON',
  TRANSIENT = 'TRANSIENT',
  REQUEST = 'REQUEST'
}
