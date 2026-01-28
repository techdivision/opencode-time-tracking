/**
 * @fileoverview Configuration type for the time tracking plugin.
 */

import type { AgentDefaultConfig } from "./AgentDefaultConfig"
import type { GlobalDefaultConfig } from "./GlobalDefaultConfig"

/**
 * Time tracking configuration as stored in `.opencode/opencode-project.json`.
 *
 * @remarks
 * The `user_email` field is not stored in the JSON file.
 * It is resolved from `OPENCODE_USER_EMAIL` environment variable
 * or falls back to the system username.
 */
export interface TimeTrackingJsonConfig {
  /**
   * Path to the CSV output file.
   *
   * @remarks
   * Supports three formats:
   * - `~/path` - Expands to home directory
   * - `/absolute/path` - Used as-is
   * - `relative/path` - Relative to project directory
   */
  csv_file: string

  /** Default Jira account key for time entries */
  default_account_key: string

  /**
   * Agent-specific default tickets.
   *
   * @remarks
   * Map of agent names (e.g., "@developer", "@reviewer") to their
   * default ticket configuration. Used when no ticket is found in context.
   */
  agent_defaults?: Record<string, AgentDefaultConfig>

  /**
   * Global fallback ticket configuration.
   *
   * @remarks
   * Used when no ticket is found in context and no agent-specific
   * default is configured.
   */
  global_default?: GlobalDefaultConfig

  /**
   * List of agent names to ignore for time tracking.
   *
   * @remarks
   * Sessions triggered by these agents will not be exported to CSV.
   * Agent names should include the "@" prefix (e.g., "@internal").
   */
  ignored_agents?: string[]
}

/**
 * Resolved time tracking configuration used at runtime.
 *
 * @remarks
 * Extends `TimeTrackingJsonConfig` with the resolved `user_email` field.
 */
export interface TimeTrackingConfig extends TimeTrackingJsonConfig {
  /**
   * User email for the worklog.
   *
   * @remarks
   * Resolved from (in order of priority):
   * 1. `OPENCODE_USER_EMAIL` environment variable
   * 2. System username (via `os.userInfo().username`)
   */
  user_email: string
}

/**
 * OpenCode project configuration structure.
 */
export interface OpencodeProjectConfig {
  /** JSON Schema reference */
  $schema?: string

  /** Time tracking configuration */
  time_tracking?: TimeTrackingJsonConfig
}
