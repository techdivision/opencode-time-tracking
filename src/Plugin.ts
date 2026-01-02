import type { Plugin, Hooks, PluginInput } from "@opencode-ai/plugin"
import { ConfigLoader } from "./services/ConfigLoader"
import { SessionManager } from "./services/SessionManager"
import { CsvWriter } from "./services/CsvWriter"
import { GitUtils } from "./utils/GitUtils"
import { createToolExecuteAfterHook } from "./hooks/ToolExecuteAfterHook"
import { createEventHook } from "./hooks/EventHook"

export const plugin: Plugin = async ({
  client,
  $,
  directory,
}: PluginInput): Promise<Hooks> => {
  const config = await ConfigLoader.load(directory)

  if (!config) {
    return {}
  }

  const sessionManager = new SessionManager()
  const csvWriter = new CsvWriter(config, directory)
  const gitUtils = new GitUtils($)

  const hooks: Hooks = {
    "tool.execute.after": createToolExecuteAfterHook(sessionManager, gitUtils),
    event: createEventHook(sessionManager, csvWriter, client),
  }

  return hooks
}

export default plugin
