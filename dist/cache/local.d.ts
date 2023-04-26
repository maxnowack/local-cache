import { CompressionMethod } from './constants';
interface CacheResult {
    cacheKey: string;
    archiveLocation: string;
}
export declare function getLocalCacheEntry(keys: string[], compressionMethod: CompressionMethod): Promise<CacheResult | undefined>;
export declare function getLocalArchiveFolder(key: string): string;
export {};
