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
exports.isGhes = exports.assertDefined = exports.getGnuTarPathOnWindows = exports.getCacheFileName = exports.getCompressionMethod = exports.unlinkFile = exports.resolvePaths = exports.getArchiveFileSizeInBytes = exports.createTempDirectory = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util = __importStar(require("util"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const glob = __importStar(require("@actions/glob"));
const io = __importStar(require("@actions/io"));
const semver = __importStar(require("semver"));
const uuid_1 = require("uuid");
const constants_1 = require("./constants");
// From https://github.com/actions/toolkit/blob/main/packages/tool-cache/src/tool-cache.ts#L23
async function createTempDirectory() {
    const IS_WINDOWS = process.platform === 'win32';
    let tempDirectory = process.env.RUNNER_TEMP || '';
    if (!tempDirectory) {
        let baseLocation;
        if (IS_WINDOWS) {
            // On Windows use the USERPROFILE env variable
            baseLocation = process.env.USERPROFILE || 'C:\\';
        }
        else if (process.platform === 'darwin') {
            baseLocation = '/Users';
        }
        else {
            baseLocation = '/home';
        }
        tempDirectory = path.join(baseLocation, 'actions', 'temp');
    }
    const dest = path.join(tempDirectory, (0, uuid_1.v4)());
    await io.mkdirP(dest);
    return dest;
}
exports.createTempDirectory = createTempDirectory;
function getArchiveFileSizeInBytes(filePath) {
    return fs.statSync(filePath).size;
}
exports.getArchiveFileSizeInBytes = getArchiveFileSizeInBytes;
async function resolvePaths(patterns) {
    const paths = [];
    const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
    const globber = await glob.create(patterns.join('\n'), {
        implicitDescendants: false,
    });
    // eslint-disable-next-line no-restricted-syntax
    for await (const file of globber.globGenerator()) {
        const relativeFile = path
            .relative(workspace, file)
            .replace(new RegExp(`\\${path.sep}`, 'g'), '/');
        core.debug(`Matched: ${relativeFile}`);
        // Paths are made relative so the tar entries are all relative to the root of the workspace.
        if (relativeFile === '') {
            // path.relative returns empty string if workspace and file are equal
            paths.push('.');
        }
        else {
            paths.push(`${relativeFile}`);
        }
    }
    return paths;
}
exports.resolvePaths = resolvePaths;
async function unlinkFile(filePath) {
    return util.promisify(fs.unlink)(filePath);
}
exports.unlinkFile = unlinkFile;
async function getVersion(app, additionalArgs = []) {
    let versionOutput = '';
    additionalArgs.push('--version');
    core.debug(`Checking ${app} ${additionalArgs.join(' ')}`);
    try {
        await exec.exec(`${app}`, additionalArgs, {
            ignoreReturnCode: true,
            silent: true,
            listeners: {
                stdout: (data) => {
                    versionOutput += data.toString();
                    return versionOutput;
                },
                stderr: (data) => {
                    versionOutput += data.toString();
                    return versionOutput;
                },
            },
        });
    }
    catch (err) {
        core.debug(err.message);
    }
    versionOutput = versionOutput.trim();
    core.debug(versionOutput);
    return versionOutput;
}
// Use zstandard if possible to maximize cache performance
async function getCompressionMethod() {
    const versionOutput = await getVersion('zstd', ['--quiet']);
    const version = semver.clean(versionOutput);
    core.debug(`zstd version: ${version}`);
    if (versionOutput === '') {
        return constants_1.CompressionMethod.Gzip;
    }
    return constants_1.CompressionMethod.ZstdWithoutLong;
}
exports.getCompressionMethod = getCompressionMethod;
function getCacheFileName(compressionMethod) {
    return compressionMethod === constants_1.CompressionMethod.Gzip
        ? constants_1.CacheFilename.Gzip
        : constants_1.CacheFilename.Zstd;
}
exports.getCacheFileName = getCacheFileName;
async function getGnuTarPathOnWindows() {
    if (fs.existsSync(constants_1.GnuTarPathOnWindows)) {
        return constants_1.GnuTarPathOnWindows;
    }
    const versionOutput = await getVersion('tar');
    return versionOutput.toLowerCase().includes('gnu tar') ? io.which('tar') : '';
}
exports.getGnuTarPathOnWindows = getGnuTarPathOnWindows;
function assertDefined(name, value) {
    if (value === undefined) {
        throw Error(`Expected ${name} but value was undefiend`);
    }
    return value;
}
exports.assertDefined = assertDefined;
function isGhes() {
    const ghUrl = new URL(process.env.GITHUB_SERVER_URL || 'https://github.com');
    return ghUrl.hostname.toUpperCase() !== 'GITHUB.COM';
}
exports.isGhes = isGhes;
