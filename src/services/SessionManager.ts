import type { ActivityData } from "../types/ActivityData"
import type { SessionData } from "../types/SessionData"
import type { TokenUsage } from "../types/TokenUsage"

export class SessionManager {
  private sessions = new Map<string, SessionData>()

  get(sessionID: string): SessionData | undefined {
    return this.sessions.get(sessionID)
  }

  has(sessionID: string): boolean {
    return this.sessions.has(sessionID)
  }

  create(sessionID: string, ticket: string | null): SessionData {
    const session: SessionData = {
      ticket,
      startTime: Date.now(),
      activities: [],
      tokenUsage: {
        input: 0,
        output: 0,
        reasoning: 0,
        cacheRead: 0,
        cacheWrite: 0,
      },
    }
    this.sessions.set(sessionID, session)
    return session
  }

  delete(sessionID: string): void {
    this.sessions.delete(sessionID)
  }

  addActivity(sessionID: string, activity: ActivityData): void {
    const session = this.sessions.get(sessionID)
    if (session) {
      session.activities.push(activity)
    }
  }

  addTokenUsage(sessionID: string, tokens: TokenUsage): void {
    const session = this.sessions.get(sessionID)
    if (session) {
      session.tokenUsage.input += tokens.input
      session.tokenUsage.output += tokens.output
      session.tokenUsage.reasoning += tokens.reasoning
      session.tokenUsage.cacheRead += tokens.cacheRead
      session.tokenUsage.cacheWrite += tokens.cacheWrite
    }
  }
}
