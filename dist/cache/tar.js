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
exports.createTar = exports.extractTar = exports.listTar = exports.getCacheFileName = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const exec_1 = require("@actions/exec");
const io = __importStar(require("@actions/io"));
const utils = __importStar(require("./cacheUtils"));
const constants_1 = require("./constants");
const IS_WINDOWS = process.platform === 'win32';
// Returns tar path and type: BSD or GNU
async function getTarPath() {
    switch (process.platform) {
        case 'win32': {
            const gnuTar = await utils.getGnuTarPathOnWindows();
            const systemTar = constants_1.SystemTarPathOnWindows;
            if (gnuTar) {
                // Use GNUtar as default on windows
                return { path: gnuTar, type: constants_1.ArchiveToolType.GNU };
            }
            if ((0, fs_1.existsSync)(systemTar)) {
                return { path: systemTar, type: constants_1.ArchiveToolType.BSD };
            }
            break;
        }
        case 'darwin': {
            const gnuTar = await io.which('gtar', false);
            if (gnuTar) {
                // fix permission denied errors when extracting BSD tar archive with GNU tar - https://github.com/actions/cache/issues/527
                return { path: gnuTar, type: constants_1.ArchiveToolType.GNU };
            }
            return {
                path: await io.which('tar', true),
                type: constants_1.ArchiveToolType.BSD,
            };
        }
        default:
            break;
    }
    // Default assumption is GNU tar is present in path
    return {
        path: await io.which('tar', true),
        type: constants_1.ArchiveToolType.GNU,
    };
}
async function getCacheFileName(compressionMethod, resolveTarPath = getTarPath()) {
    const tarPath = await resolveTarPath;
    const BSD_TAR_ZSTD = tarPath.type === constants_1.ArchiveToolType.BSD
        && compressionMethod !== constants_1.CompressionMethod.Gzip
        && IS_WINDOWS;
    return BSD_TAR_ZSTD
        ? 'cache.tar'
        : utils.getCacheFileName(compressionMethod);
}
exports.getCacheFileName = getCacheFileName;
// Return arguments for tar as per tarPath, compressionMethod, method type and os
async function getTarArgs(tarPath, compressionMethod, type, archivePath = '') {
    const args = [`"${tarPath.path}"`];
    const cacheFileName = path.join(archivePath, await getCacheFileName(compressionMethod, Promise.resolve(tarPath)));
    const tarFile = 'cache.tar';
    const workingDirectory = getWorkingDirectory();
    // Speficic args for BSD tar on windows for workaround
    const BSD_TAR_ZSTD = tarPath.type === constants_1.ArchiveToolType.BSD
        && compressionMethod !== constants_1.CompressionMethod.Gzip
        && IS_WINDOWS;
    // Method specific args
    switch (type) {
        case 'create':
            args.push('--posix', '-cf', cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'), '-P', '-C', workingDirectory.replace(new RegExp(`\\${path.sep}`, 'g'), '/'), '--files-from', constants_1.ManifestFilename);
            break;
        case 'extract':
            args.push('-xf', BSD_TAR_ZSTD
                ? tarFile
                : archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'), '-P', '-C', workingDirectory.replace(new RegExp(`\\${path.sep}`, 'g'), '/'));
            break;
        case 'list':
            args.push('-tf', BSD_TAR_ZSTD
                ? tarFile
                : archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'), '-P');
            break;
        default:
    }
    // Platform specific args
    if (tarPath.type === constants_1.ArchiveToolType.GNU) {
        switch (process.platform) {
            case 'win32':
                args.push('--force-local');
                break;
            case 'darwin':
                args.push('--delay-directory-restore');
                break;
            default:
        }
    }
    return Promise.resolve(args);
}
// Returns commands to run tar and compression program
async function getCommands(compressionMethod, type, archivePath = '') {
    let args;
    const tarPath = await getTarPath();
    const tarArgs = await getTarArgs(tarPath, compressionMethod, type, archivePath);
    const compressionArgs = type !== 'create'
        ? await getDecompressionProgram(tarPath, compressionMethod, archivePath)
        : await getCompressionProgram(tarPath, compressionMethod);
    const BSD_TAR_ZSTD = tarPath.type === constants_1.ArchiveToolType.BSD
        && compressionMethod !== constants_1.CompressionMethod.Gzip
        && IS_WINDOWS;
    if (BSD_TAR_ZSTD && type !== 'create') {
        args = [[...compressionArgs].join(' '), [...tarArgs].join(' ')];
    }
    else {
        args = [[...tarArgs].join(' '), [...compressionArgs].join(' ')];
    }
    if (BSD_TAR_ZSTD) {
        return args;
    }
    return [args.join(' ')];
}
function getWorkingDirectory() {
    return process.env.GITHUB_WORKSPACE ?? process.cwd();
}
// Common function for extractTar and listTar to get the compression method
function getDecompressionProgram(tarPath, compressionMethod, archivePath) {
    // -d: Decompress.
    // unzstd is equivalent to 'zstd -d'
    // --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
    // Using 30 here because we also support 32-bit self-hosted runners.
    const BSD_TAR_ZSTD = tarPath.type === constants_1.ArchiveToolType.BSD
        && compressionMethod !== constants_1.CompressionMethod.Gzip
        && IS_WINDOWS;
    switch (compressionMethod) {
        case constants_1.CompressionMethod.Zstd:
            return Promise.resolve(BSD_TAR_ZSTD
                ? [
                    'zstd -d --long=30 --force -o',
                    constants_1.TarFilename,
                    archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
                ]
                : [
                    '--use-compress-program',
                    IS_WINDOWS ? '"zstd -d --long=30"' : 'unzstd --long=30',
                ]);
        case constants_1.CompressionMethod.ZstdWithoutLong:
            return Promise.resolve(BSD_TAR_ZSTD
                ? [
                    'zstd -d --force -o',
                    constants_1.TarFilename,
                    archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
                ]
                : ['--use-compress-program', IS_WINDOWS ? '"zstd -d"' : 'unzstd']);
        default:
            return Promise.resolve(['-z']);
    }
}
// Used for creating the archive
// -T#: Compress using # working thread. If # is 0, attempt to detect and use the number of physical CPU cores.
// zstdmt is equivalent to 'zstd -T0'
// --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
// Using 30 here because we also support 32-bit self-hosted runners.
// Long range mode is added to zstd in v1.3.2 release, so we will not use --long in older version of zstd.
function getCompressionProgram(tarPath, compressionMethod) {
    const cacheFileName = utils.getCacheFileName(compressionMethod);
    const BSD_TAR_ZSTD = tarPath.type === constants_1.ArchiveToolType.BSD
        && compressionMethod !== constants_1.CompressionMethod.Gzip
        && IS_WINDOWS;
    switch (compressionMethod) {
        case constants_1.CompressionMethod.Zstd:
            return Promise.resolve(BSD_TAR_ZSTD
                ? [
                    'zstd -T0 --long=30 --force -o',
                    cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
                    constants_1.TarFilename,
                ]
                : [
                    '--use-compress-program',
                    IS_WINDOWS ? '"zstd -T0 --long=30"' : 'zstdmt --long=30',
                ]);
        case constants_1.CompressionMethod.ZstdWithoutLong:
            return Promise.resolve(BSD_TAR_ZSTD
                ? [
                    'zstd -T0 --force -o',
                    cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
                    constants_1.TarFilename,
                ]
                : ['--use-compress-program', IS_WINDOWS ? '"zstd -T0"' : 'zstdmt']);
        default:
            return Promise.resolve(['-z']);
    }
}
// Executes all commands as separate processes
async function execCommands(commands, cwd) {
    // eslint-disable-next-line no-restricted-syntax
    for (const command of commands) {
        try {
            // eslint-disable-next-line no-await-in-loop
            await (0, exec_1.exec)(command, undefined, {
                cwd,
                env: { ...process.env, MSYS: 'winsymlinks:nativestrict' },
            });
        }
        catch (error) {
            throw new Error(`${command.split(' ')[0]} failed with error: ${error.message}`);
        }
    }
}
// List the contents of a tar
async function listTar(archivePath, compressionMethod) {
    const commands = await getCommands(compressionMethod, 'list', archivePath);
    await execCommands(commands);
}
exports.listTar = listTar;
// Extract a tar
async function extractTar(archivePath, compressionMethod) {
    // Create directory to extract tar into
    const workingDirectory = getWorkingDirectory();
    await io.mkdirP(workingDirectory);
    const commands = await getCommands(compressionMethod, 'extract', archivePath);
    await execCommands(commands);
}
exports.extractTar = extractTar;
// Create a tar
async function createTar(archiveFolder, sourceDirectories, compressionMethod) {
    // Write source directories to manifest.txt to avoid command length limits
    (0, fs_1.writeFileSync)(path.join(archiveFolder, constants_1.ManifestFilename), sourceDirectories.join('\n'));
    const commands = await getCommands(compressionMethod, 'create', archiveFolder);
    await execCommands(commands, archiveFolder);
}
exports.createTar = createTar;
