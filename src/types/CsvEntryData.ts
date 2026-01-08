/**
 * @fileoverview CSV entry data type for worklog exports.
 */

import type { TokenUsage } from "./TokenUsage"

/**
 * Data structure for a single CSV worklog entry.
 */
export interface CsvEntryData {
  /** Jira ticket reference (e.g., "PROJ-123"), or `null` if not found */
  ticket: string | null

  /** Session start time as Unix timestamp in milliseconds */
  startTime: number

  /** Session end time as Unix timestamp in milliseconds */
  endTime: number

  /** Duration of the session in seconds */
  durationSeconds: number

  /** Human-readable description of the work performed */
  description: string

  /** Additional notes (e.g., tool usage summary) */
  notes: string

  /** Token consumption statistics */
  tokenUsage: TokenUsage

  /**
   * Model identifier in format `providerID/modelID`.
   *
   * @remarks
   * Examples: `anthropic/claude-opus-4`, `openai/gpt-5`
   */
  model: string | null

  /**
   * Agent name that performed the work.
   *
   * @remarks
   * Examples: `@developer`, `@reviewer`
   * Only the first/primary agent is tracked.
   */
  agent: string | null
}
