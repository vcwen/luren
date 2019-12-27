export { HttpStatusCode } from './HttpStatusCode'
export { HttpMethod } from './HttpMethod'
export { Phase } from './Middleware'
export { MetadataKey } from './MetadataKey'
export * from './ServiceIdentifier'

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
