"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullStateProvider = exports.StateProvider = void 0;
/* eslint-disable max-classes-per-file */
const core = __importStar(require("@actions/core"));
const constants_1 = require("./constants");
class StateProviderBase {
    getCacheState() {
        const cacheKey = this.getState(constants_1.State.CacheMatchedKey);
        if (cacheKey) {
            core.debug(`Cache state/key: ${cacheKey}`);
            return cacheKey;
        }
        return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function, class-methods-use-this
    setState = (key, value) => { };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
    getState = (key) => '';
}
class StateProvider extends StateProviderBase {
    setState = core.saveState;
    getState = core.getState;
}
exports.StateProvider = StateProvider;
class NullStateProvider extends StateProviderBase {
    stateToOutputMap = new Map([
        [constants_1.State.CacheMatchedKey, constants_1.Outputs.CacheMatchedKey],
        [constants_1.State.CachePrimaryKey, constants_1.Outputs.CachePrimaryKey],
    ]);
    setState = (key, value) => {
        core.setOutput(this.stateToOutputMap.get(key), value);
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
    getState = (key) => '';
}
exports.NullStateProvider = NullStateProvider;
