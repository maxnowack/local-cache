export enum Inputs {
  Key = 'key', // Input for cache, restore, save action
  Path = 'path', // Input for cache, restore, save action
  RestoreKeys = 'restore-keys', // Input for cache, restore action
  FailOnCacheMiss = 'fail-on-cache-miss', // Input for cache, restore action
  LookupOnly = 'lookup-only' // Input for cache, restore action
}

export enum Outputs {
  CacheHit = 'cache-hit', // Output from cache, restore action
  CachePrimaryKey = 'cache-primary-key', // Output from restore action
  CacheMatchedKey = 'cache-matched-key' // Output from restore action
}

export enum State {
  CachePrimaryKey = 'CACHE_KEY',
  CacheMatchedKey = 'CACHE_RESULT'
}
