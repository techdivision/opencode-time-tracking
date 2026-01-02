import type { TimeTrackingConfig } from "../types/TimeTrackingConfig"
import "../types/Bun"

export class ConfigLoader {
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
