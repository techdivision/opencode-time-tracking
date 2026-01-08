/**
 * @fileoverview CSV writer for exporting time tracking data.
 */

import { randomUUID } from "crypto"
import { mkdir } from "fs/promises"
import { dirname } from "path"

import type { CsvEntryData } from "../types/CsvEntryData"
import type { TimeTrackingConfig } from "../types/TimeTrackingConfig"

import { CsvFormatter } from "../utils/CsvFormatter"

import "../types/Bun"

/**
 * CSV header row for the worklog export file.
 * Compatible with Jira/Tempo time tracking import.
 */
const CSV_HEADER =
  "id,start_date,end_date,user,ticket_name,issue_key,account_key,start_time,end_time,duration_seconds,tokens_used,tokens_remaining,story_points,description,notes,model,agent"

/**
 * Writes time tracking entries to a CSV file.
 *
 * @remarks
 * The CSV format is compatible with Jira/Tempo worklog imports.
 * The file path can be absolute, relative to the project, or use `~/` for home directory.
 */
export class CsvWriter {
  /** Plugin configuration */
  private config: TimeTrackingConfig

  /** Project directory path */
  private directory: string

  /**
   * Creates a new CSV writer instance.
   *
   * @param config - The plugin configuration
   * @param directory - The project directory path
   */
  constructor(config: TimeTrackingConfig, directory: string) {
    this.config = config
    this.directory = directory
  }

  /**
   * Resolves the CSV file path from configuration.
   *
   * @returns The absolute path to the CSV file
   *
   * @remarks
   * Handles three path formats:
   * - `~/path` - Expands to home directory
   * - `/absolute/path` - Used as-is
   * - `relative/path` - Relative to project directory
   */
  private resolvePath(): string {
    let csvPath = this.config.csv_file

    if (csvPath.startsWith("~/")) {
      csvPath = csvPath.replace("~", process.env.HOME || "")
    } else if (!csvPath.startsWith("/")) {
      csvPath = `${this.directory}/${csvPath}`
    }

    return csvPath
  }

  /**
   * Writes a time tracking entry to the CSV file.
   *
   * @param data - The entry data to write
   *
   * @remarks
   * Creates the CSV file with headers if it doesn't exist.
   * Appends to existing file if it exists.
   * Creates parent directories as needed.
   *
   * @example
   * ```typescript
   * await csvWriter.write({
   *   ticket: "PROJ-123",
   *   startTime: Date.now() - 3600000,
   *   endTime: Date.now(),
   *   durationSeconds: 3600,
   *   description: "Implemented feature X",
   *   notes: "Auto-tracked: read(5x), edit(3x)",
   *   tokenUsage: { input: 1000, output: 500, reasoning: 0, cacheRead: 0, cacheWrite: 0 }
   * })
   * ```
   */
  async write(data: CsvEntryData): Promise<void> {
    const csvPath = this.resolvePath()

    try {
      await mkdir(dirname(csvPath), { recursive: true })
    } catch {
      // Directory may already exist
    }

    const file = Bun.file(csvPath)
    const exists = await file.exists()

    const totalTokens =
      data.tokenUsage.input + data.tokenUsage.output + data.tokenUsage.reasoning

    const fields = [
      randomUUID(),
      CsvFormatter.formatDate(data.startTime),
      CsvFormatter.formatDate(data.endTime),
      this.config.user_email,
      "",
      data.ticket ?? "",
      this.config.default_account_key,
      CsvFormatter.formatTime(data.startTime),
      CsvFormatter.formatTime(data.endTime),
      data.durationSeconds.toString(),
      totalTokens.toString(),
      "",
      "",
      CsvFormatter.escape(data.description),
      CsvFormatter.escape(data.notes),
      data.model ?? "",
      data.agent ?? "",
    ]

    const csvLine = fields.map((f) => `"${f}"`).join(",")

    if (!exists) {
      await Bun.write(csvPath, CSV_HEADER + "\n" + csvLine + "\n")
    } else {
      const content = await file.text()
      await Bun.write(csvPath, content + csvLine + "\n")
    }
  }
}
