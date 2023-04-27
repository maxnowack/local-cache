import * as core from '@actions/core'
import { Inputs, Outputs, State } from './constants'
import { IStateProvider } from './stateProvider'
import * as utils from './utils/actionUtils'
import * as cache from './cache'

async function restoreImpl(
  stateProvider: IStateProvider,
): Promise<string | undefined> {
  if (!utils.isCacheFeatureAvailable()) {
    core.setOutput(Outputs.CacheHit, 'false')
    console.log('UNAVAILABLE: Cache service is not enabled for this repository')
    return undefined
  }

  const primaryKey = core.getInput(Inputs.Key, { required: true })
  stateProvider.setState(State.CachePrimaryKey, primaryKey)

  const restoreKeys = utils.getInputAsArray(Inputs.RestoreKeys)
  const cachePaths = utils.getInputAsArray(Inputs.Path, {
    required: true,
  })
  const failOnCacheMiss = utils.getInputAsBool(Inputs.FailOnCacheMiss)
  const lookupOnly = utils.getInputAsBool(Inputs.LookupOnly)

  const cacheKey = await cache.restoreCache(
    cachePaths,
    primaryKey,
    restoreKeys,
    lookupOnly,
  )

  if (!cacheKey) {
    if (failOnCacheMiss) {
      throw new Error(
        `Failed to restore cache entry. Exiting as fail-on-cache-miss is set. Input key: ${primaryKey}`,
      )
    }
    core.info(
      `Cache not found for input keys: ${[
        primaryKey,
        ...restoreKeys,
      ].join(', ')}`,
    )

    return cacheKey
  }

  // Store the matched cache key in states
  stateProvider.setState(State.CacheMatchedKey, cacheKey)

  const isExactKeyMatch = utils.isExactKeyMatch(
    core.getInput(Inputs.Key, { required: true }),
    cacheKey,
  )

  core.setOutput(Outputs.CacheHit, isExactKeyMatch.toString())
  if (lookupOnly) {
    core.info(`Cache found and can be restored from key: ${cacheKey}`)
  } else {
    core.info(`Cache restored from key: ${cacheKey}`)
  }

  return cacheKey
}

export default restoreImpl
