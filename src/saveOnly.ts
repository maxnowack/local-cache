import * as core from '@actions/core'
import saveImpl from './saveImpl'
import { NullStateProvider } from './stateProvider'

async function run(): Promise<void> {
  const cacheId = await saveImpl(new NullStateProvider())
  if (cacheId === -1) {
    core.warning('Cache save failed.')
  }
}

run()
  .catch((error: unknown) => {
    core.setFailed((error as Error).message)
  })

export default run
