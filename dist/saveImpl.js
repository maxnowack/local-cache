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
// Catch and log any unhandled exceptions.  These exceptions can leak out of the uploadChunk method in
// @actions/toolkit when a failed upload closes the file descriptor causing any in-process reads to
// throw an uncaught exception.  Instead of failing this action, just warn.
process.on('uncaughtException', e => utils.logWarning(e.message));
async function saveImpl(stateProvider) {
    if (!utils.isCacheFeatureAvailable()) {
        return undefined;
    }
    // If restore has stored a primary key in state, reuse that
    // Else re-evaluate from inputs
    const primaryKey = stateProvider.getState(constants_1.State.CachePrimaryKey)
        || core.getInput(constants_1.Inputs.Key);
    if (!primaryKey) {
        utils.logWarning('Key is not specified.');
        return undefined;
    }
    // If matched restore key is same as primary key, then do not save cache
    // NO-OP in case of SaveOnly action
    const restoredKey = stateProvider.getCacheState();
    if (utils.isExactKeyMatch(primaryKey, restoredKey)) {
        core.info(`Cache hit occurred on the primary key ${primaryKey}, not saving cache.`);
        return undefined;
    }
    const cachePaths = utils.getInputAsArray(constants_1.Inputs.Path, {
        required: true,
    });
    try {
        await cache.saveCache(cachePaths, primaryKey);
    }
    catch (error) {
        return -1;
    }
    return undefined;
}
exports.default = saveImpl;
