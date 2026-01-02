import type { SessionManager } from "../services/SessionManager"
import type { GitUtils } from "../utils/GitUtils"
import type { ToolExecuteAfterInput } from "../types/ToolExecuteAfterInput"
import type { ToolExecuteAfterOutput } from "../types/ToolExecuteAfterOutput"

export function createToolExecuteAfterHook(
  sessionManager: SessionManager,
  gitUtils: GitUtils
) {
  return async (
    input: ToolExecuteAfterInput,
    output: ToolExecuteAfterOutput
  ): Promise<void> => {
    const { tool, sessionID } = input
    const { title, metadata } = output

    if (!sessionManager.has(sessionID)) {
      const ticket = await gitUtils.extractTicket()
      sessionManager.create(sessionID, ticket)
    }

    let file: string | undefined
    if (metadata) {
      const meta = metadata as Record<string, unknown>
      file = (meta.filePath || meta.filepath || meta.file) as string | undefined
      if (!file && meta.filediff) {
        file = (meta.filediff as Record<string, unknown>).file as
          | string
          | undefined
      }
    }
    if (!file && title) {
      file = title
    }

    sessionManager.addActivity(sessionID, {
      tool,
      timestamp: Date.now(),
      file,
    })
  }
}
