/**
 * @fileoverview Event hook for session lifecycle and token tracking.
 */

import type { AssistantMessage, Event, Message } from "@opencode-ai/sdk"

import type { CsvWriter } from "../services/CsvWriter"
import type { SessionManager } from "../services/SessionManager"
import type { MessagePartUpdatedProperties } from "../types/MessagePartUpdatedProperties"
import type { MessageWithParts } from "../types/MessageWithParts"
import type { OpencodeClient } from "../types/OpencodeClient"

import { DescriptionGenerator } from "../utils/DescriptionGenerator"

/**
 * Properties for message.updated events.
 */
interface MessageUpdatedProperties {
  info: Message
}

/**
 * Extracts the summary title from the last user message.
 *
 * @param client - The OpenCode SDK client
 * @param sessionID - The session identifier
 * @returns The summary title, or `null` if not found
 *
 * @internal
 */
async function extractSummaryTitle(
  client: OpencodeClient,
  sessionID: string
): Promise<string | null> {
  try {
    const result = await client.session.messages({
      path: { id: sessionID },
    } as Parameters<typeof client.session.messages>[0])

    if (!result.data) {
      return null
    }

    const messages = result.data as MessageWithParts[]

    // Find the last user message with a summary title
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]

      if (message.info.role === "user" && message.info.summary?.title) {
        return message.info.summary.title
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Creates the event hook for session lifecycle management.
 *
 * @param sessionManager - The session manager instance
 * @param csvWriter - The CSV writer instance
 * @param client - The OpenCode SDK client
 * @returns The event hook function
 *
 * @remarks
 * Handles three types of events:
 *
 * 1. **message.updated** - Tracks model from assistant messages
 * 2. **message.part.updated** - Tracks token usage from step-finish parts
 * 3. **session.idle** - Finalizes and exports the session
 *
 * @example
 * ```typescript
 * const hooks: Hooks = {
 *   event: createEventHook(sessionManager, csvWriter, client),
 * }
 * ```
 */
export function createEventHook(
  sessionManager: SessionManager,
  csvWriter: CsvWriter,
  client: OpencodeClient
) {
  return async ({ event }: { event: Event }): Promise<void> => {
    // Track model from assistant messages
    if (event.type === "message.updated") {
      const props = event.properties as MessageUpdatedProperties
      const message = props.info

      if (message.role === "assistant") {
        const assistantMsg = message as AssistantMessage

        if (assistantMsg.modelID && assistantMsg.providerID) {
          sessionManager.setModel(assistantMsg.sessionID, {
            modelID: assistantMsg.modelID,
            providerID: assistantMsg.providerID,
          })
        }
      }

      return
    }

    // Track token usage and agent from message part events
    if (event.type === "message.part.updated") {
      const props = event.properties as MessagePartUpdatedProperties
      const part = props.part

      // Track agent from agent parts (only first agent is stored)
      if (part.type === "agent" && part.sessionID && part.name) {
        sessionManager.setAgent(part.sessionID, part.name)
      }

      // Track token usage from step-finish events
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

    // Handle session idle events (only log on idle, not on deleted)
    if (event.type === "session.idle") {
      const props = event.properties as { sessionID?: string }
      const sessionID = props.sessionID

      if (!sessionID) {
        return
      }

      const session = sessionManager.get(sessionID)

      if (!session || session.activities.length === 0) {
        sessionManager.delete(sessionID)
        return
      }

      const endTime = Date.now()
      const durationSeconds = Math.round((endTime - session.startTime) / 1000)

      // Try to get summary title from messages, fallback to generated description
      const summaryTitle = await extractSummaryTitle(client, sessionID)
      const description =
        summaryTitle || DescriptionGenerator.generate(session.activities)

      const toolSummary = DescriptionGenerator.generateToolSummary(
        session.activities
      )

      const totalTokens =
        session.tokenUsage.input +
        session.tokenUsage.output +
        session.tokenUsage.reasoning

      // Format model as providerID/modelID
      const modelString = session.model
        ? `${session.model.providerID}/${session.model.modelID}`
        : null

      // Get agent name if available
      const agentString = session.agent?.name ?? null

      try {
        await csvWriter.write({
          ticket: session.ticket,
          startTime: session.startTime,
          endTime,
          durationSeconds,
          description,
          notes: `Auto-tracked: ${toolSummary}`,
          tokenUsage: session.tokenUsage,
          model: modelString,
          agent: agentString,
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
