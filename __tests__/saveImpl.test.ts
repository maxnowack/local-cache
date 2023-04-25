import * as core from '@actions/core'
import * as cache from '../src/cache'
import { Inputs } from '../src/constants'
import run from '../src/saveImpl'
import { StateProvider } from '../src/stateProvider'
import * as actionUtils from '../src/utils/actionUtils'
import * as testUtils from '../src/utils/testUtils'

jest.mock('@actions/core')
jest.mock('../src/cache')
jest.mock('../src/utils/actionUtils')

beforeAll(() => {
  jest.spyOn(core, 'getInput').mockImplementation((name, options) =>
    jest.requireActual('@actions/core').getInput(name, options))

  jest.spyOn(actionUtils, 'getInputAsArray').mockImplementation(
    (name, options) => jest
      .requireActual('../src/utils/actionUtils')
      .getInputAsArray(name, options),
  )

  jest.spyOn(actionUtils, 'getInputAsInt').mockImplementation(
    (name, options) => jest
      .requireActual('../src/utils/actionUtils')
      .getInputAsInt(name, options),
  )

  jest.spyOn(actionUtils, 'getInputAsBool').mockImplementation(
    (name, options) => jest
      .requireActual('../src/utils/actionUtils')
      .getInputAsBool(name, options),
  )

  jest.spyOn(actionUtils, 'isExactKeyMatch').mockImplementation(
    (key, cacheResult) => jest
      .requireActual('../src/utils/actionUtils')
      .isExactKeyMatch(key, cacheResult),
  )
})

beforeEach(() => {
  jest.restoreAllMocks()
  jest.spyOn(actionUtils, 'isGhes').mockImplementation(() => false)
  jest.spyOn(actionUtils, 'isCacheFeatureAvailable').mockImplementation(
    () => true,
  )
})

afterEach(() => {
  testUtils.clearInputs()
})

test('save with no primary key in state outputs warning', async () => {
  const logWarningMock = jest.spyOn(actionUtils, 'logWarning')
  const failedMock = jest.spyOn(core, 'setFailed')

  const savedCacheKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  jest.spyOn(core, 'getState')
  // Cache Entry State
    .mockImplementationOnce(() => '')
  // Cache Key State
    .mockImplementationOnce(() => savedCacheKey)
  const saveCacheMock = jest.spyOn(cache, 'saveCache')

  await run(new StateProvider())

  expect(saveCacheMock).toHaveBeenCalledTimes(0)
  expect(logWarningMock).toHaveBeenCalledWith('Key is not specified.')
  expect(logWarningMock).toHaveBeenCalledTimes(1)
  expect(failedMock).toHaveBeenCalledTimes(0)
})

test('save without AC available should no-op', async () => {
  jest.spyOn(actionUtils, 'isCacheFeatureAvailable').mockImplementation(
    () => false,
  )

  const saveCacheMock = jest.spyOn(cache, 'saveCache')

  await run(new StateProvider())

  expect(saveCacheMock).toHaveBeenCalledTimes(0)
})

test('save on ghes without AC available should no-op', async () => {
  jest.spyOn(actionUtils, 'isGhes').mockImplementation(() => true)
  jest.spyOn(actionUtils, 'isCacheFeatureAvailable').mockImplementation(
    () => false,
  )

  const saveCacheMock = jest.spyOn(cache, 'saveCache')

  await run(new StateProvider())

  expect(saveCacheMock).toHaveBeenCalledTimes(0)
})

test('save on GHES with AC available', async () => {
  jest.spyOn(actionUtils, 'isGhes').mockImplementation(() => true)
  const failedMock = jest.spyOn(core, 'setFailed')

  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const savedCacheKey = 'Linux-node-'

  jest.spyOn(core, 'getState')
  // Cache Entry State
    .mockImplementationOnce(() => savedCacheKey)
  // Cache Key State
    .mockImplementationOnce(() => primaryKey)

  const inputPath = 'node_modules'
  testUtils.setInput(Inputs.Path, inputPath)

  const saveCacheMock = jest
    .spyOn(cache, 'saveCache')
    .mockImplementationOnce(() => Promise.resolve())

  await run(new StateProvider())

  expect(saveCacheMock).toHaveBeenCalledTimes(1)
  expect(saveCacheMock).toHaveBeenCalledWith(
    [inputPath],
    primaryKey,
  )

  expect(failedMock).toHaveBeenCalledTimes(0)
})

test('save with exact match returns early', async () => {
  const infoMock = jest.spyOn(core, 'info')
  const failedMock = jest.spyOn(core, 'setFailed')

  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const savedCacheKey = primaryKey

  jest.spyOn(core, 'getState')
  // Cache Entry State
    .mockImplementationOnce(() => savedCacheKey)
  // Cache Key State
    .mockImplementationOnce(() => primaryKey)
  const saveCacheMock = jest.spyOn(cache, 'saveCache')

  await run(new StateProvider())

  expect(saveCacheMock).toHaveBeenCalledTimes(0)
  expect(infoMock).toHaveBeenCalledWith(
    `Cache hit occurred on the primary key ${primaryKey}, not saving cache.`,
  )
  expect(failedMock).toHaveBeenCalledTimes(0)
})

test('save with missing input outputs warning', async () => {
  const logWarningMock = jest.spyOn(actionUtils, 'logWarning')
  const failedMock = jest.spyOn(core, 'setFailed')

  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const savedCacheKey = 'Linux-node-'

  jest.spyOn(core, 'getState')
  // Cache Entry State
    .mockImplementationOnce(() => savedCacheKey)
  // Cache Key State
    .mockImplementationOnce(() => primaryKey)
  const saveCacheMock = jest.spyOn(cache, 'saveCache')

  await run(new StateProvider())

  expect(saveCacheMock).toHaveBeenCalledTimes(0)
  expect(logWarningMock).toHaveBeenCalledWith(
    'Input required and not supplied: path',
  )
  expect(logWarningMock).toHaveBeenCalledTimes(1)
  expect(failedMock).toHaveBeenCalledTimes(0)
})

test('save with large cache outputs warning', async () => {
  const logWarningMock = jest.spyOn(actionUtils, 'logWarning')
  const failedMock = jest.spyOn(core, 'setFailed')

  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const savedCacheKey = 'Linux-node-'

  jest.spyOn(core, 'getState')
  // Cache Entry State
    .mockImplementationOnce(() => savedCacheKey)
  // Cache Key State
    .mockImplementationOnce(() => primaryKey)

  const inputPath = 'node_modules'
  testUtils.setInput(Inputs.Path, inputPath)

  const saveCacheMock = jest
    .spyOn(cache, 'saveCache')
    .mockImplementationOnce(() => {
      throw new Error(
        'Cache size of ~6144 MB (6442450944 B) is over the 5GB limit, not saving cache.',
      )
    })

  await run(new StateProvider())

  expect(saveCacheMock).toHaveBeenCalledTimes(1)
  expect(saveCacheMock).toHaveBeenCalledWith(
    [inputPath],
    primaryKey,
    expect.anything(),
    false,
  )

  expect(logWarningMock).toHaveBeenCalledTimes(1)
  expect(logWarningMock).toHaveBeenCalledWith(
    'Cache size of ~6144 MB (6442450944 B) is over the 5GB limit, not saving cache.',
  )
  expect(failedMock).toHaveBeenCalledTimes(0)
})

test('save with server error outputs warning', async () => {
  const logWarningMock = jest.spyOn(actionUtils, 'logWarning')
  const failedMock = jest.spyOn(core, 'setFailed')

  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const savedCacheKey = 'Linux-node-'

  jest.spyOn(core, 'getState')
  // Cache Entry State
    .mockImplementationOnce(() => savedCacheKey)
  // Cache Key State
    .mockImplementationOnce(() => primaryKey)

  const inputPath = 'node_modules'
  testUtils.setInput(Inputs.Path, inputPath)

  const saveCacheMock = jest
    .spyOn(cache, 'saveCache')
    .mockImplementationOnce(() => {
      throw new Error('HTTP Error Occurred')
    })

  await run(new StateProvider())

  expect(saveCacheMock).toHaveBeenCalledTimes(1)
  expect(saveCacheMock).toHaveBeenCalledWith(
    [inputPath],
    primaryKey,
    expect.anything(),
    false,
  )

  expect(logWarningMock).toHaveBeenCalledTimes(1)
  expect(logWarningMock).toHaveBeenCalledWith('HTTP Error Occurred')

  expect(failedMock).toHaveBeenCalledTimes(0)
})

test('save with valid inputs uploads a cache', async () => {
  const failedMock = jest.spyOn(core, 'setFailed')

  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'
  const savedCacheKey = 'Linux-node-'

  jest.spyOn(core, 'getState')
  // Cache Entry State
    .mockImplementationOnce(() => savedCacheKey)
  // Cache Key State
    .mockImplementationOnce(() => primaryKey)

  const inputPath = 'node_modules'
  testUtils.setInput(Inputs.Path, inputPath)

  const saveCacheMock = jest
    .spyOn(cache, 'saveCache')
    .mockImplementationOnce(() => Promise.resolve())

  await run(new StateProvider())

  expect(saveCacheMock).toHaveBeenCalledTimes(1)
  expect(saveCacheMock).toHaveBeenCalledWith(
    [inputPath],
    primaryKey,
  )

  expect(failedMock).toHaveBeenCalledTimes(0)
})
