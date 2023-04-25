import * as core from '@actions/core';
export interface IStateProvider {
    setState(key: string, value: string): void;
    getState(key: string): string;
    getCacheState(): string | undefined;
}
declare class StateProviderBase implements IStateProvider {
    getCacheState(): string | undefined;
    setState: (key: string, value: string) => void;
    getState: (key: string) => string;
}
export declare class StateProvider extends StateProviderBase {
    setState: typeof core.saveState;
    getState: typeof core.getState;
}
export declare class NullStateProvider extends StateProviderBase {
    stateToOutputMap: Map<string, string>;
    setState: (key: string, value: string) => void;
    getState: (key: string) => string;
}
export {};
