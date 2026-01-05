/**
 * @fileoverview Configuration loader for the time tracking plugin.
 */

import type {
  OpencodeProjectConfig,
  TimeTrackingConfig,
} from "../types/TimeTrackingConfig"

import "../types/Bun"

/**
 * Loads the plugin configuration from the project directory.
 *
 * @remarks
 * The configuration file is expected at `.opencode/opencode-project.json`
 * within the project directory, with a `time_tracking` section.
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
    const configPath = `${directory}/.opencode/opencode-project.json`

    try {
      const file = Bun.file(configPath)

      if (await file.exists()) {
        const projectConfig = (await file.json()) as OpencodeProjectConfig

        if (projectConfig.time_tracking) {
          return projectConfig.time_tracking
        }
      }

      return null
    } catch {
      return null
    }
  }
}
