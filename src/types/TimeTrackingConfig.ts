/**
 * @fileoverview Configuration type for the time tracking plugin.
 */

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
