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
exports.getLocalArchiveFolder = exports.getLocalCacheEntry = void 0;
const path = __importStar(require("path"));
const io_util_1 = require("@actions/io/lib/io-util");
const tar_1 = require("./tar");
async function getLocalCacheEntry(keys, compressionMethod) {
    const cacheFileName = await (0, tar_1.getCacheFileName)(compressionMethod);
    const result = await keys.reduce(async (asyncMemo, key) => {
        const memo = await asyncMemo;
        if (memo)
            return memo;
        const cacheDir = await getLocalArchiveFolder(key, true);
        if (!cacheDir || !await (0, io_util_1.exists)(cacheDir))
            return undefined;
        const cacheKey = path.basename(cacheDir);
        const archiveLocation = path.join(cacheDir, cacheFileName);
        if (!await (0, io_util_1.exists)(archiveLocation))
            return undefined;
        return {
            cacheKey,
            archiveLocation,
        };
    }, Promise.resolve(undefined));
    return result;
}
exports.getLocalCacheEntry = getLocalCacheEntry;
// eslint-disable-next-line max-len
async function getLocalArchiveFolder(key, findKey = false) {
    const { GITHUB_REPOSITORY, RUNNER_TOOL_CACHE } = process.env;
    if (!RUNNER_TOOL_CACHE) {
        throw new TypeError('Expected RUNNER_TOOL_CACHE environment variable to be defined.');
    }
    if (!GITHUB_REPOSITORY) {
        throw new TypeError('Expected GITHUB_REPOSITORY environment variable to be defined.');
    }
    const cachePath = path.join(RUNNER_TOOL_CACHE, GITHUB_REPOSITORY);
    const primaryCacheKey = path.join(cachePath, key);
    if (!findKey || await (0, io_util_1.exists)(primaryCacheKey))
        return primaryCacheKey;
    const files = await (0, io_util_1.readdir)(cachePath);
    const { cacheKey } = await files.reduce(async (asyncMemo, file) => {
        const memo = await asyncMemo;
        const stats = await (0, io_util_1.lstat)(path.join(cachePath, file));
        if (!file.startsWith(key) || !stats.isDirectory())
            return memo;
        if (stats.birthtimeMs > memo.cacheBirthtimeMs) {
            return { cacheKey: file, cacheBirthtimeMs: stats.birthtimeMs };
        }
        return memo;
    }, Promise.resolve({ cacheKey: undefined, cacheBirthtimeMs: 0 }));
    if (!cacheKey)
        return undefined;
    return path.join(cachePath, cacheKey);
}
exports.getLocalArchiveFolder = getLocalArchiveFolder;
