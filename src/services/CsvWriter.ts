import { randomUUID } from "crypto"
import { mkdir } from "fs/promises"
import { dirname } from "path"
import type { TimeTrackingConfig } from "../types/TimeTrackingConfig"
import type { CsvEntryData } from "../types/CsvEntryData"
import { CsvFormatter } from "../utils/CsvFormatter"
import "../types/Bun"

const CSV_HEADER =
  "id,start_date,end_date,user,ticket_name,issue_key,account_key,start_time,end_time,duration_seconds,tokens_used,tokens_remaining,story_points,description,notes"

export class CsvWriter {
  private config: TimeTrackingConfig
  private directory: string

  constructor(config: TimeTrackingConfig, directory: string) {
    this.config = config
    this.directory = directory
  }

  private resolvePath(): string {
    let csvPath = this.config.csv_file

    if (csvPath.startsWith("~/")) {
      csvPath = csvPath.replace("~", process.env.HOME || "")
    } else if (!csvPath.startsWith("/")) {
      csvPath = `${this.directory}/${csvPath}`
    }

    return csvPath
  }

  async write(data: CsvEntryData): Promise<void> {
    const csvPath = this.resolvePath()

    try {
      await mkdir(dirname(csvPath), { recursive: true })
    } catch {
      // ignore
    }

    const file = Bun.file(csvPath)
    const exists = await file.exists()

    const totalTokens =
      data.tokenUsage.input +
      data.tokenUsage.output +
      data.tokenUsage.reasoning

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
