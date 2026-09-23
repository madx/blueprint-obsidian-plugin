import { BlueprintOptions } from './types'

function validateOptions(object: unknown): object is BlueprintOptions {
  if (!object || !(typeof object === 'object')) {
    return false
  }

  if ('folder' in object && typeof object.folder !== 'string') {
    return false
  }

  return true
}

export { validateOptions }
