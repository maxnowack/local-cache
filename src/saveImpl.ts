import * as core from '@actions/core'
import { Inputs, State } from './constants'
import { IStateProvider } from './stateProvider'
import * as utils from './utils/actionUtils'
import * as cache from './cache'

// Catch and log any unhandled exceptions.  These exceptions can leak out of the uploadChunk method in
// @actions/toolkit when a failed upload closes the file descriptor causing any in-process reads to
// throw an uncaught exception.  Instead of failing this action, just warn.
process.on('uncaughtException', e => utils.logWarning(e.message))

async function saveImpl(stateProvider: IStateProvider): Promise<number | void> {
  if (!utils.isCacheFeatureAvailable()) {
    return undefined
  }

  // If restore has stored a primary key in state, reuse that
  // Else re-evaluate from inputs
  const primaryKey = stateProvider.getState(State.CachePrimaryKey)
          || core.getInput(Inputs.Key)

  if (!primaryKey) {
    utils.logWarning('Key is not specified.')
    return undefined
  }

  // If matched restore key is same as primary key, then do not save cache
  // NO-OP in case of SaveOnly action
  const restoredKey = stateProvider.getCacheState()

  if (utils.isExactKeyMatch(primaryKey, restoredKey)) {
    core.info(
      `Cache hit occurred on the primary key ${primaryKey}, not saving cache.`,
    )
    return undefined
  }

  const cachePaths = utils.getInputAsArray(Inputs.Path, {
    required: true,
  })

  try {
    await cache.saveCache(
      cachePaths,
      primaryKey,
    )
  } catch (error) {
    return -1
  }
  return undefined
}

export default saveImpl
