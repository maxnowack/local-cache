import * as path from 'path'
import { exists } from '@actions/io/lib/io-util'
import { CompressionMethod } from './constants'
import { getCacheFileName } from './tar'

interface CacheResult {
  cacheKey: string,
  archiveLocation: string,
}

export async function getLocalCacheEntry(
  keys: string[],
  compressionMethod: CompressionMethod,
): Promise<CacheResult | undefined> {
  const cacheFileName = await getCacheFileName(compressionMethod)
  const result = await keys.reduce<Promise<CacheResult | undefined>>(async (asyncMemo, key) => {
    const memo = await asyncMemo
    if (memo) return memo
    const cacheDir = getLocalArchiveFolder(key)
    if (!await exists(cacheDir)) return undefined
    const archiveLocation = path.join(cacheDir, cacheFileName)
    if (!await exists(archiveLocation)) return undefined
    return {
      cacheKey: key,
      archiveLocation,
    }
  }, Promise.resolve(undefined))
  return result
}

export function getLocalArchiveFolder(key: string) {
  const { GITHUB_REPOSITORY, RUNNER_TOOL_CACHE } = process.env
  if (!RUNNER_TOOL_CACHE) {
    throw new TypeError('Expected RUNNER_TOOL_CACHE environment variable to be defined.')
  }

  if (!GITHUB_REPOSITORY) {
    throw new TypeError('Expected GITHUB_REPOSITORY environment variable to be defined.')
  }

  return path.join(RUNNER_TOOL_CACHE, GITHUB_REPOSITORY, key)
}
