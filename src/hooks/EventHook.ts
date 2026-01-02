import type { Event } from "@opencode-ai/sdk"
import type { SessionManager } from "../services/SessionManager"
import type { CsvWriter } from "../services/CsvWriter"
import type { OpencodeClient } from "../types/OpencodeClient"
import type { MessagePartUpdatedProperties } from "../types/MessagePartUpdatedProperties"
import { DescriptionGenerator } from "../utils/DescriptionGenerator"

export function createEventHook(
  sessionManager: SessionManager,
  csvWriter: CsvWriter,
  client: OpencodeClient
) {
  return async ({ event }: { event: Event }): Promise<void> => {
    // Track token usage from step-finish events
    if (event.type === "message.part.updated") {
      const props = event.properties as MessagePartUpdatedProperties
      const part = props.part

      if (part.type === "step-finish" && part.sessionID && part.tokens) {
        sessionManager.addTokenUsage(part.sessionID, {
          input: part.tokens.input,
          output: part.tokens.output,
          reasoning: part.tokens.reasoning,
          cacheRead: part.tokens.cache.read,
          cacheWrite: part.tokens.cache.write,
        })
      }
      return
    }

    // Handle session end events
    if (event.type === "session.idle" || event.type === "session.deleted") {
      const props = event.properties as { sessionID?: string }
      const sessionID = props.sessionID

      if (!sessionID) return

      const session = sessionManager.get(sessionID)
      if (!session || session.activities.length === 0) {
        sessionManager.delete(sessionID)
        return
      }

      const endTime = Date.now()
      const durationSeconds = Math.round((endTime - session.startTime) / 1000)
      const description = DescriptionGenerator.generate(session.activities)
      const toolSummary = DescriptionGenerator.generateToolSummary(
        session.activities
      )

      const totalTokens =
        session.tokenUsage.input +
        session.tokenUsage.output +
        session.tokenUsage.reasoning

      try {
        await csvWriter.write({
          ticket: session.ticket,
          startTime: session.startTime,
          endTime,
          durationSeconds,
          description,
          notes: `Auto-tracked: ${toolSummary}`,
          tokenUsage: session.tokenUsage,
        })

        const minutes = Math.round(durationSeconds / 60)
        await client.tui.showToast({
          body: {
            message: `Time tracked: ${minutes} min, ${totalTokens} tokens${session.ticket ? ` for ${session.ticket}` : ""}`,
            variant: "success",
          },
        })
      } catch {
        await client.tui.showToast({
          body: {
            message: "Time Tracking: Failed to save entry",
            variant: "error",
          },
        })
      }

      sessionManager.delete(sessionID)
    }
  }
}
