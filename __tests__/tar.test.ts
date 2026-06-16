import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as cacheUtils from '../src/cache/cacheUtils'
import { CompressionMethod } from '../src/cache/constants'
import {
  createTar,
  extractTar,
  listTar,
} from '../src/cache/tar'

jest.mock('@actions/exec')
jest.mock('@actions/io')

const execMock = exec.exec as jest.MockedFunction<typeof exec.exec>
const mkdirPMock = io.mkdirP as jest.MockedFunction<typeof io.mkdirP>
const whichMock = io.which as jest.MockedFunction<typeof io.which>

let archiveFolder = ''
let originalWorkspace: string | undefined

beforeEach(() => {
  archiveFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'local-cache-tar-'))
  originalWorkspace = process.env.GITHUB_WORKSPACE
  process.env.GITHUB_WORKSPACE = process.cwd()

  execMock.mockResolvedValue(0)
  mkdirPMock.mockResolvedValue()
  whichMock.mockResolvedValue('tar')
  jest.spyOn(cacheUtils, 'getGnuTarPathOnWindows').mockResolvedValue('tar')
})

afterEach(() => {
  process.env.GITHUB_WORKSPACE = originalWorkspace
  fs.rmSync(archiveFolder, { recursive: true, force: true })
  jest.restoreAllMocks()
})

test('createTar uses lz4 compression program', async () => {
  await createTar(archiveFolder, ['node_modules'], CompressionMethod.Lz4)

  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock.mock.calls[0][0]).toContain('--use-compress-program lz4')
  expect(execMock.mock.calls[0][0]).toContain('cache.tlz4')
  expect(execMock.mock.calls[0][0]).toContain('--files-from manifest.txt')
  expect(execMock.mock.calls[0][2]?.cwd).toBe(archiveFolder)
})

test('extractTar uses lz4 decompression program', async () => {
  await extractTar(path.join(archiveFolder, 'cache.tlz4'), CompressionMethod.Lz4)

  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock.mock.calls[0][0]).toContain('--use-compress-program')
  expect(execMock.mock.calls[0][0]).toContain('lz4 -d')
  expect(execMock.mock.calls[0][0]).toContain('cache.tlz4')
})

test('listTar uses lz4 decompression program', async () => {
  await listTar(path.join(archiveFolder, 'cache.tlz4'), CompressionMethod.Lz4)

  expect(execMock).toHaveBeenCalledTimes(1)
  expect(execMock.mock.calls[0][0]).toContain('--use-compress-program')
  expect(execMock.mock.calls[0][0]).toContain('lz4 -d')
  expect(execMock.mock.calls[0][0]).toContain('cache.tlz4')
})
