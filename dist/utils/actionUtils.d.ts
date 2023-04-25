import * as core from '@actions/core';
export declare function isGhes(): boolean;
export declare function isExactKeyMatch(key: string, cacheKey?: string): boolean;
export declare function logWarning(message: string): void;
export declare function getInputAsArray(name: string, options?: core.InputOptions): string[];
export declare function getInputAsInt(name: string, options?: core.InputOptions): number | undefined;
export declare function getInputAsBool(name: string, options?: core.InputOptions): boolean;
export declare function isCacheFeatureAvailable(): boolean;
