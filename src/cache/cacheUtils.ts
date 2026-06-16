import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as glob from '@actions/glob'
import * as io from '@actions/io'
import * as semver from 'semver'
import { v4 as uuidV4 } from 'uuid'
import { Inputs } from '../constants'
import {
  CacheFilename,
  CompressionMethod,
  GnuTarPathOnWindows,
} from './constants'

// From https://github.com/actions/toolkit/blob/main/packages/tool-cache/src/tool-cache.ts#L23
export async function createTempDirectory(): Promise<string> {
  const IS_WINDOWS = process.platform === 'win32'

  let tempDirectory: string = process.env.RUNNER_TEMP || ''

  if (!tempDirectory) {
    let baseLocation: string
    if (IS_WINDOWS) {
      // On Windows use the USERPROFILE env variable
      baseLocation = process.env.USERPROFILE || 'C:\\'
    } else if (process.platform === 'darwin') {
      baseLocation = '/Users'
    } else {
      baseLocation = '/home'
    }
    tempDirectory = path.join(baseLocation, 'actions', 'temp')
  }

  const dest = path.join(tempDirectory, uuidV4())
  await io.mkdirP(dest)
  return dest
}

export function getArchiveFileSizeInBytes(filePath: string): number {
  return fs.statSync(filePath).size
}

function getPathSizeInBytes(filePath: string): number {
  const stats = fs.lstatSync(filePath)

  if (!stats.isDirectory()) {
    return stats.size
  }

  return fs.readdirSync(filePath).reduce(
    (total, entry) => total + getPathSizeInBytes(path.join(filePath, entry)),
    0,
  )
}

export function getCacheSizeInBytes(paths: string[]): number {
  const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd()

  return paths.reduce((total, cachePath) => {
    const filePath = path.isAbsolute(cachePath)
      ? cachePath
      : path.join(workspace, cachePath)

    if (!fs.existsSync(filePath)) {
      return total
    }

    return total + getPathSizeInBytes(filePath)
  }, 0)
}

export async function resolvePaths(patterns: string[]): Promise<string[]> {
  const paths: string[] = []
  const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd()
  const globber = await glob.create(patterns.join('\n'), {
    implicitDescendants: false,
  })

  // eslint-disable-next-line no-restricted-syntax
  for await (const file of globber.globGenerator()) {
    const relativeFile = path
      .relative(workspace, file)
      .replace(new RegExp(`\\${path.sep}`, 'g'), '/')
    core.debug(`Matched: ${relativeFile}`)
    // Paths are made relative so the tar entries are all relative to the root of the workspace.
    if (relativeFile === '') {
      // path.relative returns empty string if workspace and file are equal
      paths.push('.')
    } else {
      paths.push(`${relativeFile}`)
    }
  }

  return paths
}

export async function unlinkFile(filePath: fs.PathLike): Promise<void> {
  return util.promisify(fs.unlink)(filePath)
}

async function getVersion(
  app: string,
  additionalArgs: string[] = [],
): Promise<string> {
  let versionOutput = ''
  additionalArgs.push('--version')
  core.debug(`Checking ${app} ${additionalArgs.join(' ')}`)
  try {
    await exec.exec(`${app}`, additionalArgs, {
      ignoreReturnCode: true,
      silent: true,
      listeners: {
        stdout: (data: Buffer) => {
          versionOutput += data.toString()
          return versionOutput
        },
        stderr: (data: Buffer) => {
          versionOutput += data.toString()
          return versionOutput
        },
      },
    })
  } catch (err) {
    core.debug((err as Error).message)
  }

  versionOutput = versionOutput.trim()
  core.debug(versionOutput)
  return versionOutput
}

// Use zstandard if possible to maximize cache performance
export async function getCompressionMethod(): Promise<CompressionMethod> {
  const compressionMode = core.getInput(Inputs.CompressionMode) || 'auto'
  switch (compressionMode.toLowerCase()) {
    case 'auto':
      break
    case CompressionMethod.Gzip:
      return CompressionMethod.Gzip
    case CompressionMethod.Lz4:
      return CompressionMethod.Lz4
    case CompressionMethod.Zstd:
      return CompressionMethod.ZstdWithoutLong
    default:
      throw new Error(
        `Unsupported compression mode: ${compressionMode}. Supported modes are: auto, gzip, zstd, lz4.`,
      )
  }

  const versionOutput = await getVersion('zstd', ['--quiet'])
  const version = semver.clean(versionOutput)
  core.debug(`zstd version: ${version}`)

  if (versionOutput === '') {
    return CompressionMethod.Gzip
  }
  return CompressionMethod.ZstdWithoutLong
}

export function getCacheFileName(compressionMethod: CompressionMethod): string {
  switch (compressionMethod) {
    case CompressionMethod.Gzip:
      return CacheFilename.Gzip
    case CompressionMethod.Lz4:
      return CacheFilename.Lz4
    default:
      return CacheFilename.Zstd
  }
}

export async function getGnuTarPathOnWindows(): Promise<string> {
  if (fs.existsSync(GnuTarPathOnWindows)) {
    return GnuTarPathOnWindows
  }
  const versionOutput = await getVersion('tar')
  return versionOutput.toLowerCase().includes('gnu tar') ? io.which('tar') : ''
}

export function assertDefined<T>(name: string, value?: T): T {
  if (value === undefined) {
    throw Error(`Expected ${name} but value was undefiend`)
  }

  return value
}

export function isGhes(): boolean {
  const ghUrl = new URL(
    process.env.GITHUB_SERVER_URL || 'https://github.com',
  )
  return ghUrl.hostname.toUpperCase() !== 'GITHUB.COM'
}
