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
const core = __importStar(require("@actions/core"));
const constants_1 = require("./constants");
const utils = __importStar(require("./utils/actionUtils"));
const cache = __importStar(require("./cache"));
async function restoreImpl(stateProvider) {
    if (!utils.isCacheFeatureAvailable()) {
        core.setOutput(constants_1.Outputs.CacheHit, 'false');
        console.log('UNAVAILABLE: Cache service is not enabled for this repository');
        return undefined;
    }
    const primaryKey = core.getInput(constants_1.Inputs.Key, { required: true });
    stateProvider.setState(constants_1.State.CachePrimaryKey, primaryKey);
    const restoreKeys = utils.getInputAsArray(constants_1.Inputs.RestoreKeys);
    const cachePaths = utils.getInputAsArray(constants_1.Inputs.Path, {
        required: true,
    });
    const failOnCacheMiss = utils.getInputAsBool(constants_1.Inputs.FailOnCacheMiss);
    const lookupOnly = utils.getInputAsBool(constants_1.Inputs.LookupOnly);
    const cacheKey = await cache.restoreCache(cachePaths, primaryKey, restoreKeys, lookupOnly);
    if (!cacheKey) {
        if (failOnCacheMiss) {
            throw new Error(`Failed to restore cache entry. Exiting as fail-on-cache-miss is set. Input key: ${primaryKey}`);
        }
        core.info(`Cache not found for input keys: ${[
            primaryKey,
            ...restoreKeys,
        ].join(', ')}`);
        return cacheKey;
    }
    // Store the matched cache key in states
    stateProvider.setState(constants_1.State.CacheMatchedKey, cacheKey);
    console.log(utils.isExactKeyMatch);
    const isExactKeyMatch = utils.isExactKeyMatch(core.getInput(constants_1.Inputs.Key, { required: true }), cacheKey);
    core.setOutput(constants_1.Outputs.CacheHit, isExactKeyMatch.toString());
    if (lookupOnly) {
        core.info(`Cache found and can be restored from key: ${cacheKey}`);
    }
    else {
        core.info(`Cache restored from key: ${cacheKey}`);
    }
    return cacheKey;
}
exports.default = restoreImpl;
