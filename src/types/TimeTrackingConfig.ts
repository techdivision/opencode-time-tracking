/**
 * @fileoverview Configuration type for the time tracking plugin.
 */

/**
 * Plugin configuration loaded from `.opencode/time-tracking.json`.
 */
export interface TimeTrackingConfig {
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

  /** Email address of the user for the worklog */
  user_email: string

  /** Default Jira account key for time entries */
  default_account_key: string
}
