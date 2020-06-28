const METADATA_KEY_PREFIX = '__luren__:'

const key = (metadataKey: string) => {
  return METADATA_KEY_PREFIX + metadataKey
}

export const MetadataKey = {
  AUTHENTICATION_SCOPE: key('AUTHENTICATOR_SCOPE'),
  CONTROLLER: key('CONTROLLER'),
  MIDDLEWARE: key('MIDDLEWARE'),
  PROCESSORS: key('PROCESSORS'),
  ACTIONS: key('ACTIONS'),
  PARAMS: key('PARAMS'),
  RESPONSE: key('RESPONSE'),
  INDEX: key('INDEX'),
  MODEL: key('MODEL'),
  AUTHENTICATORS: key('AUTHENTICATORS'),
  AUTHORIZERS: key('AUTHORIZERS'),
  HIDDEN_ACTIONS: key('HIDDEN_ACTIONS')
}

export default MetadataKey
