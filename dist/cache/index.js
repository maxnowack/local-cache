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
exports.saveCache = exports.restoreCache = exports.isFeatureAvailable = void 0;
const path = __importStar(require("path"));
const core = __importStar(require("@actions/core"));
const io = __importStar(require("@actions/io"));
const utils = __importStar(require("./cacheUtils"));
const tar_1 = require("./tar");
const errors_1 = require("./errors");
const local_1 = require("./local");
function checkPaths(paths) {
    if (!paths || paths.length === 0) {
        throw new errors_1.ValidationError('Path Validation Error: At least one directory or file path is required');
    }
}
function checkKey(key) {
    if (key.length > 512) {
        throw new errors_1.ValidationError(`Key Validation Error: ${key} cannot be larger than 512 characters.`);
    }
    const regex = /^[^,]*$/;
    if (!regex.test(key)) {
        throw new errors_1.ValidationError(`Key Validation Error: ${key} cannot contain commas.`);
    }
}
/**
 * isFeatureAvailable to check the presence of Actions cache service
 *
 * @returns boolean return true if Actions cache service feature is available, otherwise false
 */
function isFeatureAvailable() {
    return true;
}
exports.isFeatureAvailable = isFeatureAvailable;
/**
 * Restores cache from keys
 *
 * @param paths a list of file paths to restore from the cache
 * @param primaryKey an explicit key for restoring the cache
 * @param restoreKeys an optional ordered list of keys to use for restoring the cache if no cache hit occurred for key
 * @param downloadOptions cache download options
 * @param enableCrossOsArchive an optional boolean enabled to restore on windows any cache created on any platform
 * @returns string returns the key for the cache hit, otherwise returns undefined
 */
async function restoreCache(paths, primaryKey, restoreKeys, lookupOnly) {
    checkPaths(paths);
    // eslint-disable-next-line no-param-reassign
    restoreKeys = restoreKeys || [];
    const keys = [primaryKey, ...restoreKeys];
    core.debug('Resolved Keys:');
    core.debug(JSON.stringify(keys));
    if (keys.length > 10) {
        throw new errors_1.ValidationError('Key Validation Error: Keys are limited to a maximum of 10.');
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const key of keys) {
        checkKey(key);
    }
    const compressionMethod = await utils.getCompressionMethod();
    let archivePath = '';
    try {
        // path are needed to compute version
        const cacheEntry = await (0, local_1.getLocalCacheEntry)(keys, compressionMethod);
        if (!cacheEntry?.archiveLocation) {
            // Cache not found
            return undefined;
        }
        if (lookupOnly) {
            core.info('Lookup only - skipping download');
            return cacheEntry.cacheKey;
        }
        archivePath = cacheEntry.archiveLocation;
        if (core.isDebug()) {
            await (0, tar_1.listTar)(archivePath, compressionMethod);
        }
        const archiveFileSize = utils.getArchiveFileSizeInBytes(archivePath);
        core.info(`Cache Size: ~${Math.round(archiveFileSize / (1024 * 1024))} MB (${archiveFileSize} B)`);
        await (0, tar_1.extractTar)(archivePath, compressionMethod);
        core.info('Cache restored successfully');
        return cacheEntry.cacheKey;
    }
    catch (error) {
        const typedError = error;
        if (typedError.name === errors_1.ValidationError.name) {
            throw error;
        }
        else {
            // Supress all non-validation cache related errors because caching should be optional
            core.warning(`Failed to restore: ${error.message}`);
        }
    }
    return undefined;
}
exports.restoreCache = restoreCache;
/**
 * Saves a list of files with the specified key
 *
 * @param paths a list of file paths to be cached
 * @param key an explicit key for restoring the cache
 * @param enableCrossOsArchive an optional boolean enabled to save cache on windows which could be restored on any platform
 * @param options cache upload options
 * @returns number returns cacheId if the cache was saved successfully and throws an error if save fails
 */
async function saveCache(paths, key) {
    checkPaths(paths);
    checkKey(key);
    const compressionMethod = await utils.getCompressionMethod();
    const cachePaths = await utils.resolvePaths(paths);
    core.debug('Cache Paths:');
    core.debug(`${JSON.stringify(cachePaths)}`);
    if (cachePaths.length === 0) {
        throw new Error(
        // eslint-disable-next-line max-len
        'Path Validation Error: Path(s) specified in the action for caching do(es) not exist, hence no cache is being saved.');
    }
    const archiveFolder = (0, local_1.getLocalArchiveFolder)(key);
    await io.mkdirP(archiveFolder);
    const archivePath = path.join(archiveFolder, utils.getCacheFileName(compressionMethod));
    core.debug(`Archive Path: ${archivePath}`);
    try {
        await (0, tar_1.createTar)(archiveFolder, cachePaths, compressionMethod);
        if (core.isDebug()) {
            await (0, tar_1.listTar)(archivePath, compressionMethod);
        }
        const fileSizeLimit = 10 * 1024 * 1024 * 1024; // 10GB per repo limit
        const archiveFileSize = utils.getArchiveFileSizeInBytes(archivePath);
        core.debug(`File Size: ${archiveFileSize}`);
        // For GHES, this check will take place in ReserveCache API with enterprise file size limit
        if (archiveFileSize > fileSizeLimit && !utils.isGhes()) {
            throw new Error(`Cache size of ~${Math.round(archiveFileSize / (1024 * 1024))} MB (${archiveFileSize} B) is over the 10GB limit, not saving cache.`);
        }
    }
    catch (error) {
        const typedError = error;
        if (typedError.name === errors_1.ValidationError.name) {
            throw error;
        }
        else if (typedError.name === errors_1.ReserveCacheError.name) {
            core.info(`Failed to save: ${typedError.message}`);
        }
        else {
            core.warning(`Failed to save: ${typedError.message}`);
        }
    }
}
exports.saveCache = saveCache;
