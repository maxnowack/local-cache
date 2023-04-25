import * as core from '@actions/core'
import saveImpl from './saveImpl'
import { StateProvider } from './stateProvider'

async function run(): Promise<void> {
  await saveImpl(new StateProvider())
}

run()
  .catch((error: unknown) => {
    core.setFailed((error as Error).message)
  })

export default run
