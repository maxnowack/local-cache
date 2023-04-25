import * as core from '@actions/core'
import restoreImpl from './restoreImpl'
import { NullStateProvider } from './stateProvider'

async function run(): Promise<void> {
  await restoreImpl(new NullStateProvider())
}

run()
  .catch((error: unknown) => {
    core.setFailed((error as Error).message)
  })

export default run
