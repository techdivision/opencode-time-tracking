/**
 * @fileoverview Configuration loader for the time tracking plugin.
 */

import type { TimeTrackingConfig } from "../types/TimeTrackingConfig"

import "../types/Bun"

/**
 * Loads the plugin configuration from the project directory.
 *
 * @remarks
 * The configuration file is expected at `.opencode/time-tracking.json`
 * within the project directory.
 */
export class ConfigLoader {
  /**
   * Loads the time tracking configuration from the filesystem.
   *
   * @param directory - The project directory path
   * @returns The configuration object, or `null` if not found or invalid
   *
   * @example
   * ```typescript
   * const config = await ConfigLoader.load("/path/to/project")
   * if (config) {
   *   console.log(config.csv_file)
   * }
   * ```
   */
  static async load(directory: string): Promise<TimeTrackingConfig | null> {
    const configPath = `${directory}/.opencode/time-tracking.json`

    try {
      const file = Bun.file(configPath)

      if (await file.exists()) {
        return (await file.json()) as TimeTrackingConfig
      }

      return null
    } catch {
      return null
    }
  }
}
