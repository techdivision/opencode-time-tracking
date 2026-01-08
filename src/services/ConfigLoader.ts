/**
 * @fileoverview Configuration loader for the time tracking plugin.
 */

import { userInfo } from "os"

import type {
  OpencodeProjectConfig,
  TimeTrackingConfig,
} from "../types/TimeTrackingConfig"

import "../types/Bun"

/**
 * Environment variable name for user email.
 */
const ENV_USER_EMAIL = "OPENCODE_USER_EMAIL"

/**
 * Loads a value from a .env file in the specified directory.
 *
 * @param directory - The directory containing the .env file
 * @param key - The environment variable key to look for
 * @returns The value if found, or `null` if not found
 *
 * @internal
 */
async function loadEnvValue(
  directory: string,
  key: string
): Promise<string | null> {
  const envPath = `${directory}/.env`

  try {
    const file = Bun.file(envPath)

    if (await file.exists()) {
      const content = await file.text()
      // Match KEY=value, handling optional quotes
      const regex = new RegExp(`^${key}=(.*)$`, "m")
      const match = content.match(regex)

      if (match) {
        // Remove surrounding quotes (single or double) and trim
        return match[1].trim().replace(/^["']|["']$/g, "")
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Loads the plugin configuration from the project directory.
 *
 * @remarks
 * The configuration file is expected at `.opencode/opencode-project.json`
 * within the project directory, with a `time_tracking` section.
 *
 * The `user_email` is resolved from (in order of priority):
 * 1. `OPENCODE_USER_EMAIL` system environment variable
 * 2. `OPENCODE_USER_EMAIL` from project `.env` file
 * 3. System username (fallback)
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
   *   console.log(config.user_email) // Resolved from ENV, .env file, or system username
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
          const jsonConfig = projectConfig.time_tracking

          // Resolve user_email with fallback chain:
          // 1. System environment variable
          // 2. Project .env file
          // 3. System username
          const envValue = await loadEnvValue(directory, ENV_USER_EMAIL)
          const userEmail =
            process.env[ENV_USER_EMAIL] || envValue || userInfo().username

          return {
            ...jsonConfig,
            user_email: userEmail,
          }
        }
      }

      return null
    } catch {
      return null
    }
  }
}
