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
exports.isCacheFeatureAvailable = exports.getInputAsBool = exports.getInputAsInt = exports.getInputAsArray = exports.logWarning = exports.isExactKeyMatch = exports.isGhes = void 0;
const core = __importStar(require("@actions/core"));
const cache = __importStar(require("../cache"));
function isGhes() {
    const ghUrl = new URL(process.env.GITHUB_SERVER_URL || 'https://github.com');
    return ghUrl.hostname.toUpperCase() !== 'GITHUB.COM';
}
exports.isGhes = isGhes;
function isExactKeyMatch(key, cacheKey) {
    console.log('isExactKeyMatch', key, cacheKey);
    return !!(cacheKey
        && cacheKey.localeCompare(key, undefined, {
            sensitivity: 'accent',
        }) === 0);
}
exports.isExactKeyMatch = isExactKeyMatch;
function logWarning(message) {
    const warningPrefix = '[warning]';
    core.info(`${warningPrefix}${message}`);
}
exports.logWarning = logWarning;
function getInputAsArray(name, options) {
    return core
        .getInput(name, options)
        .split('\n')
        .map(s => s.replace(/^!\s+/, '!').trim())
        .filter(x => x !== '');
}
exports.getInputAsArray = getInputAsArray;
function getInputAsInt(name, options) {
    const value = parseInt(core.getInput(name, options), 10);
    if (Number.isNaN(value) || value < 0) {
        return undefined;
    }
    return value;
}
exports.getInputAsInt = getInputAsInt;
function getInputAsBool(name, options) {
    const result = core.getInput(name, options);
    return result.toLowerCase() === 'true';
}
exports.getInputAsBool = getInputAsBool;
function isCacheFeatureAvailable() {
    if (cache.isFeatureAvailable()) {
        return true;
    }
    if (isGhes()) {
        logWarning(`Cache action is only supported on GHES version >= 3.5. If you are on version >=3.5 Please check with GHES admin if Actions cache service is enabled or not.
Otherwise please upgrade to GHES version >= 3.5 and If you are also using Github Connect, please unretire the actions/cache namespace before upgrade (see https://docs.github.com/en/enterprise-server@3.5/admin/github-actions/managing-access-to-actions-from-githubcom/enabling-automatic-access-to-githubcom-actions-using-github-connect#automatic-retirement-of-namespaces-for-actions-accessed-on-githubcom)`);
        return false;
    }
    logWarning('An internal error has occurred in cache backend. Please check https://www.githubstatus.com/ for any ongoing issue in actions.');
    return false;
}
exports.isCacheFeatureAvailable = isCacheFeatureAvailable;
