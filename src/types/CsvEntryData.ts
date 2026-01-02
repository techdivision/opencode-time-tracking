import type { TokenUsage } from "./TokenUsage"

export interface CsvEntryData {
  ticket: string | null
  startTime: number
  endTime: number
  durationSeconds: number
  description: string
  notes: string
  tokenUsage: TokenUsage
}
