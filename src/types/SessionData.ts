import type { ActivityData } from "./ActivityData"
import type { TokenUsage } from "./TokenUsage"

export interface SessionData {
  ticket: string | null
  startTime: number
  activities: ActivityData[]
  tokenUsage: TokenUsage
}
