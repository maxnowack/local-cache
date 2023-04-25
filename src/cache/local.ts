import * as path from 'path'
import { mkdirP } from '@actions/io'
import { exists } from '@actions/io/lib/io-util'

interface CacheResult {
  cacheKey: string,
  archiveLocation: string,
}

const { GITHUB_REPOSITORY, RUNNER_TOOL_CACHE } = process.env

export async function getLocalCacheEntry(keys: string[]): Promise<CacheResult | undefined> {
  if (!RUNNER_TOOL_CACHE) {
    throw new TypeError('Expected RUNNER_TOOL_CACHE environment variable to be defined.')
  }

  if (!GITHUB_REPOSITORY) {
    throw new TypeError('Expected GITHUB_REPOSITORY environment variable to be defined.')
  }

  const result = await keys.reduce<Promise<CacheResult | undefined>>(async (memo, key) => {
    if (await memo) return memo
    const cacheDir = path.join(RUNNER_TOOL_CACHE, GITHUB_REPOSITORY, key)
    if (!await exists(cacheDir)) return undefined
    const archiveLocation = path.join(cacheDir, 'cache.tgz')
    if (!await exists(archiveLocation)) return undefined
    return {
      cacheKey: key,
      archiveLocation,
    }
  }, Promise.resolve(undefined))
  return result
}

export async function getLocalArchivePath(key: string): Promise<string> {
  if (!RUNNER_TOOL_CACHE) {
    throw new TypeError('Expected RUNNER_TOOL_CACHE environment variable to be defined.')
  }

  if (!GITHUB_REPOSITORY) {
    throw new TypeError('Expected GITHUB_REPOSITORY environment variable to be defined.')
  }

  const cacheDir = path.join(RUNNER_TOOL_CACHE, GITHUB_REPOSITORY, key)
  await mkdirP(cacheDir)
  const archiveLocation = path.join(cacheDir, 'cache.tgz')
  return archiveLocation
}
