export declare function setInput(name: string, value: string): void;
interface CacheInput {
    path: string;
    key: string;
    restoreKeys?: string[];
    enableCrossOsArchive?: boolean;
    failOnCacheMiss?: boolean;
    lookupOnly?: boolean;
}
export declare function setInputs(input: CacheInput): void;
export declare function clearInputs(): void;
export {};
