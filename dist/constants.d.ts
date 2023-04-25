export declare enum Inputs {
    Key = "key",
    Path = "path",
    RestoreKeys = "restore-keys",
    FailOnCacheMiss = "fail-on-cache-miss",
    LookupOnly = "lookup-only"
}
export declare enum Outputs {
    CacheHit = "cache-hit",
    CachePrimaryKey = "cache-primary-key",
    CacheMatchedKey = "cache-matched-key"
}
export declare enum State {
    CachePrimaryKey = "CACHE_KEY",
    CacheMatchedKey = "CACHE_RESULT"
}
