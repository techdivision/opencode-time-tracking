/**
 * @fileoverview Event hook for session lifecycle and token tracking.
 */

import type { Event } from "@opencode-ai/sdk"

import type { CsvWriter } from "../services/CsvWriter"
import type { SessionManager } from "../services/SessionManager"
import type { MessagePartUpdatedProperties } from "../types/MessagePartUpdatedProperties"
import type { MessageWithParts } from "../types/MessageWithParts"
import type { OpencodeClient } from "../types/OpencodeClient"

import { DescriptionGenerator } from "../utils/DescriptionGenerator"

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
 * Handles two types of events:
 *
 * 1. **message.part.updated** - Tracks token usage from step-finish parts
 * 2. **session.idle** - Finalizes and exports the session
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
  // Track sessions that are currently being processed to prevent duplicates
  const processingSessions = new Set<string>()

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

    // Handle session idle events (only log on idle, not on deleted)
    if (event.type === "session.idle") {
      const props = event.properties as { sessionID?: string }
      const sessionID = props.sessionID

      if (!sessionID) {
        return
      }

      // Debug: Log all session.idle events
      console.log(`[TimeTracking] ${new Date().toISOString()} Received session.idle for session ${sessionID}, processingSessions size before: ${processingSessions.size}`)

      // Prevent duplicate processing if this session is already being handled
      if (processingSessions.has(sessionID)) {
        console.log(`[TimeTracking] ${new Date().toISOString()} Skipping duplicate session.idle for session ${sessionID}`)
        return
      }

      // Mark this session as being processed
      processingSessions.add(sessionID)
      console.log(`[TimeTracking] ${new Date().toISOString()} Added session ${sessionID} to processingSessions, size now: ${processingSessions.size}`)

      const session = sessionManager.get(sessionID)

      if (!session || session.activities.length === 0) {
        sessionManager.delete(sessionID)
        processingSessions.delete(sessionID)
        return
      }

      // Delete session immediately to prevent duplicate processing
      sessionManager.delete(sessionID)

      // Debug: Log if we're processing this session
      console.log(`[TimeTracking] ${new Date().toISOString()} Processing session.idle for session ${sessionID}, activities: ${session.activities.length}, processingSessions: [${Array.from(processingSessions).join(', ')}]`)

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

        // Remove from processing set when done
        processingSessions.delete(sessionID)
      }
  }
}
