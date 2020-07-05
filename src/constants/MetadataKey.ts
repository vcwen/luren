const METADATA_KEY_PREFIX = '__luren__:'

const key = (metadataKey: string) => {
  return METADATA_KEY_PREFIX + metadataKey
}

export const MetadataKey = {
  AUTHENTICATOR_MOUNT_TYPE: key('AUTHENTICATOR_MOUNT_TYPE'),
  CONTROLLER: key('CONTROLLER'),
  CONTROLLER_MODULE: key('CONTROLLER_MODULE'),
  MIDDLEWARE: key('MIDDLEWARE'),
  PROCESSORS: key('PROCESSORS'),
  ACTION_MODULE: key('ACTION_MODULE'),
  ACTIONS: key('ACTIONS'),
  PARAMS: key('PARAMS'),
  RESPONSE: key('RESPONSE'),
  INDEX: key('INDEX'),
  MODEL: key('MODEL'),
  GUARDS: key('GUARDS'),
  AUTHORIZERS: key('AUTHORIZERS'),
  HIDDEN_ACTIONS: key('HIDDEN_ACTIONS')
}

export default MetadataKey
