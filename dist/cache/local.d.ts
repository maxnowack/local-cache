interface CacheResult {
    cacheKey: string;
    archiveLocation: string;
}
export declare function getLocalCacheEntry(keys: string[]): Promise<CacheResult | undefined>;
export declare function getLocalArchivePath(key: string): Promise<string>;
export {};
