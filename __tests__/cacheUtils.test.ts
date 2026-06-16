import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {
  getCacheFileName,
  getCacheSizeInBytes,
  getCompressionMethod,
} from '../src/cache/cacheUtils'
import {
  CacheFilename,
  CompressionMethod,
} from '../src/cache/constants'
import { Inputs } from '../src/constants'
import * as testUtils from '../src/utils/testUtils'

jest.mock('@actions/exec')

const execMock = exec.exec as jest.MockedFunction<typeof exec.exec>
let originalWorkspace: string | undefined

function mockVersionOutput(output: string): void {
  execMock.mockImplementation(async (commandLine, args, options) => {
    options?.listeners?.stdout?.(Buffer.from(output))
    return 0
  })
}

afterEach(() => {
  process.env.GITHUB_WORKSPACE = originalWorkspace
  testUtils.clearInputs()
  jest.clearAllMocks()
})

test('getCompressionMethod returns lz4 when selected', async () => {
  testUtils.setInput(Inputs.CompressionMode, 'lz4')

  await expect(getCompressionMethod()).resolves.toBe(CompressionMethod.Lz4)
  expect(execMock).not.toHaveBeenCalled()
})

test('getCompressionMethod returns zstd when selected', async () => {
  testUtils.setInput(Inputs.CompressionMode, 'zstd')

  await expect(getCompressionMethod()).resolves.toBe(
    CompressionMethod.ZstdWithoutLong,
  )
  expect(execMock).not.toHaveBeenCalled()
})

test('getCompressionMethod auto-selects zstd when available', async () => {
  mockVersionOutput('1.5.5')

  await expect(getCompressionMethod()).resolves.toBe(
    CompressionMethod.ZstdWithoutLong,
  )
})

test('getCompressionMethod auto-selects gzip when zstd is unavailable', async () => {
  mockVersionOutput('')

  await expect(getCompressionMethod()).resolves.toBe(CompressionMethod.Gzip)
})

test('getCompressionMethod rejects unsupported compression modes', async () => {
  testUtils.setInput(Inputs.CompressionMode, 'snappy')

  await expect(getCompressionMethod()).rejects.toThrow(
    'Unsupported compression mode: snappy',
  )
})

test('getCacheFileName returns lz4 archive filename', () => {
  expect(getCacheFileName(CompressionMethod.Lz4)).toBe(CacheFilename.Lz4)
})

test('getCacheSizeInBytes returns recursive source size', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'local-cache-size-'))
  originalWorkspace = process.env.GITHUB_WORKSPACE
  process.env.GITHUB_WORKSPACE = workspace

  try {
    fs.mkdirSync(path.join(workspace, 'cache-dir'))
    fs.writeFileSync(path.join(workspace, 'cache-dir', 'first.txt'), 'hello')
    fs.writeFileSync(path.join(workspace, 'second.txt'), 'world!')

    expect(getCacheSizeInBytes(['cache-dir', 'second.txt'])).toBe(11)
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true })
  }
})
