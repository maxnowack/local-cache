import * as core from '@actions/core'
import * as cache from '../src/cache'
import { Inputs } from '../src/constants'
import run from '../src/saveOnly'
import * as actionUtils from '../src/utils/actionUtils'
import * as testUtils from '../src/utils/testUtils'

jest.mock('@actions/core')
jest.mock('../src/cache')
jest.mock('../src/utils/actionUtils')

beforeAll(() => {
  jest.spyOn(core, 'getInput').mockImplementation((name, options) =>
    jest.requireActual('@actions/core').getInput(name, options))

  jest.spyOn(core, 'setOutput').mockImplementation((key, value) =>
    jest.requireActual('@actions/core').getInput(key, value))

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
  jest.spyOn(actionUtils, 'isGhes').mockImplementation(() => false)
  jest.spyOn(actionUtils, 'isCacheFeatureAvailable').mockImplementation(
    () => true,
  )
})

afterEach(() => {
  testUtils.clearInputs()
})

test('save with valid inputs uploads a cache', async () => {
  const failedMock = jest.spyOn(core, 'setFailed')

  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'

  const inputPath = 'node_modules'
  testUtils.setInput(Inputs.Key, primaryKey)
  testUtils.setInput(Inputs.Path, inputPath)

  const saveCacheMock = jest
    .spyOn(cache, 'saveCache')
    .mockImplementationOnce(() => Promise.resolve())

  await run()

  expect(saveCacheMock).toHaveBeenCalledTimes(1)
  expect(saveCacheMock).toHaveBeenCalledWith(
    [inputPath],
    primaryKey,
  )

  expect(failedMock).toHaveBeenCalledTimes(0)
})

test('save failing logs the warning message', async () => {
  const warningMock = jest.spyOn(core, 'warning')

  const primaryKey = 'Linux-node-bb828da54c148048dd17899ba9fda624811cfb43'

  const inputPath = 'node_modules'
  testUtils.setInput(Inputs.Key, primaryKey)
  testUtils.setInput(Inputs.Path, inputPath)

  const saveCacheMock = jest
    .spyOn(cache, 'saveCache')
    .mockImplementationOnce(() => Promise.reject())

  await run()

  expect(saveCacheMock).toHaveBeenCalledTimes(1)
  expect(saveCacheMock).toHaveBeenCalledWith(
    [inputPath],
    primaryKey,
  )

  expect(warningMock).toHaveBeenCalledTimes(1)
  expect(warningMock).toHaveBeenCalledWith('Cache save failed.')
})
