const METADATA_KEY_PREFIX = 'luren:'

const key = (metadataKey: string) => {
  return METADATA_KEY_PREFIX + metadataKey
}

export const MetadataKey = {
  AUTHENTICATION: key('AUTHENTICATION'),
  AUTHORIZATION: key('AUTHORIZATION'),
  CONTROLLER: key('CONTROLLER'),
  MIDDLEWARE: key('MIDDLEWARE'),
  ACTIONS: key('ACTIONS'),
  PARAMS: key('PARAMS'),
  RESPONSE: key('RESPONSE'),
  INDEX: key('INDEX'),
  MODEL: key('MODEL'),
  ACL: key('ACL'),
  RESOURCE: key('RESOURCE'),
  HIDDEN_ACTIONS: key('HIDDEN_ACTIONS')
}

export default MetadataKey
