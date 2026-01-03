/**
 * @fileoverview OpenCode Time Tracking Plugin
 *
 * Automatically tracks session duration, tool usage, and token consumption,
 * exporting data to CSV for time tracking integration (e.g., Jira/Tempo).
 *
 * @packageDocumentation
 */

import type { Plugin, Hooks, PluginInput } from "@opencode-ai/plugin"

import { ConfigLoader } from "./services/ConfigLoader"
import { CsvWriter } from "./services/CsvWriter"
import { SessionManager } from "./services/SessionManager"
import { TicketExtractor } from "./services/TicketExtractor"
import { createEventHook } from "./hooks/EventHook"
import { createToolExecuteAfterHook } from "./hooks/ToolExecuteAfterHook"

/**
 * OpenCode Time Tracking Plugin
 *
 * This plugin automatically tracks:
 * - Session duration (start/end time)
 * - Tool usage (which tools were called)
 * - Token consumption (input/output/reasoning tokens)
 * - Ticket references (extracted from user messages or todos)
 *
 * Data is exported to a CSV file configured in `.opencode/time-tracking.json`.
 *
 * @param input - Plugin input containing client, directory, and other context
 * @returns Hooks object with event and tool.execute.after handlers
 *
 * @example
 * ```json
 * // .opencode/time-tracking.json
 * {
 *   "csv_file": "~/worklogs/time.csv",
 *   "user_email": "user@example.com",
 *   "default_account_key": "ACCOUNT-1"
 * }
 * ```
 */
export const plugin: Plugin = async ({
  client,
  directory,
}: PluginInput): Promise<Hooks> => {
  const config = await ConfigLoader.load(directory)

  if (!config) {
    return {}
  }

  const sessionManager = new SessionManager()
  const csvWriter = new CsvWriter(config, directory)
  const ticketExtractor = new TicketExtractor(client)

  const hooks: Hooks = {
    "tool.execute.after": createToolExecuteAfterHook(
      sessionManager,
      ticketExtractor
    ),
    event: createEventHook(sessionManager, csvWriter, client),
  }

  return hooks
}

export default plugin
