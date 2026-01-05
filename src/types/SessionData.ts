/**
 * @fileoverview Session data type for time tracking state.
 */

import type { ActivityData } from "./ActivityData"
import type { ModelInfo } from "./ModelInfo"
import type { TokenUsage } from "./TokenUsage"

/**
 * State data for a tracked session.
 */
export interface SessionData {
  /** Jira ticket reference, or `null` if not found */
  ticket: string | null

  /** Session start time as Unix timestamp in milliseconds */
  startTime: number

  /** Array of tool activities recorded during the session */
  activities: ActivityData[]

  /** Cumulative token usage for the session */
  tokenUsage: TokenUsage

  /** Model used in this session, or `null` if not detected */
  model: ModelInfo | null
}
