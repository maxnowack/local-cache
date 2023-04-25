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
exports.getLocalArchivePath = exports.getLocalCacheEntry = void 0;
const path = __importStar(require("path"));
const io_1 = require("@actions/io");
const io_util_1 = require("@actions/io/lib/io-util");
const { GITHUB_REPOSITORY, RUNNER_TOOL_CACHE } = process.env;
async function getLocalCacheEntry(keys) {
    if (!RUNNER_TOOL_CACHE) {
        throw new TypeError('Expected RUNNER_TOOL_CACHE environment variable to be defined.');
    }
    if (!GITHUB_REPOSITORY) {
        throw new TypeError('Expected GITHUB_REPOSITORY environment variable to be defined.');
    }
    const result = await keys.reduce(async (memo, key) => {
        if (await memo)
            return memo;
        const cacheDir = path.join(RUNNER_TOOL_CACHE, GITHUB_REPOSITORY, key);
        if (!await (0, io_util_1.exists)(cacheDir))
            return undefined;
        const archiveLocation = path.join(cacheDir, 'cache.tgz');
        if (!await (0, io_util_1.exists)(archiveLocation))
            return undefined;
        return {
            cacheKey: key,
            archiveLocation,
        };
    }, Promise.resolve(undefined));
    return result;
}
exports.getLocalCacheEntry = getLocalCacheEntry;
async function getLocalArchivePath(key) {
    if (!RUNNER_TOOL_CACHE) {
        throw new TypeError('Expected RUNNER_TOOL_CACHE environment variable to be defined.');
    }
    if (!GITHUB_REPOSITORY) {
        throw new TypeError('Expected GITHUB_REPOSITORY environment variable to be defined.');
    }
    const cacheDir = path.join(RUNNER_TOOL_CACHE, GITHUB_REPOSITORY, key);
    await (0, io_1.mkdirP)(cacheDir);
    const archiveLocation = path.join(cacheDir, 'cache.tgz');
    return archiveLocation;
}
exports.getLocalArchivePath = getLocalArchivePath;
