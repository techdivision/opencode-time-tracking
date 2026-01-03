import type { OpencodeClient } from "../types/OpencodeClient"
import type { MessageWithParts } from "../types/MessageWithParts"
import type { Todo } from "../types/Todo"

const TICKET_PATTERN = /([A-Z]+-\d+)/

export class TicketExtractor {
  private client: OpencodeClient

  constructor(client: OpencodeClient) {
    this.client = client
  }

  async extract(sessionID: string): Promise<string | null> {
    // First, try to extract from user messages
    const ticketFromMessages = await this.extractFromMessages(sessionID)
    if (ticketFromMessages) {
      return ticketFromMessages
    }

    // Fallback: try to extract from todos
    const ticketFromTodos = await this.extractFromTodos(sessionID)
    return ticketFromTodos
  }

  private async extractFromMessages(sessionID: string): Promise<string | null> {
    try {
      const result = await this.client.session.messages({
        path: { id: sessionID },
      } as Parameters<typeof this.client.session.messages>[0])

      if (!result.data) {
        return null
      }

      const messages = result.data as MessageWithParts[]

      // Scan user messages for ticket pattern
      for (const message of messages) {
        if (message.info.role !== "user") {
          continue
        }

        for (const part of message.parts) {
          if (part.type === "text" && part.text) {
            const ticket = this.extractFromText(part.text)
            if (ticket) {
              return ticket
            }
          }
        }
      }

      return null
    } catch {
      return null
    }
  }

  private async extractFromTodos(sessionID: string): Promise<string | null> {
    try {
      const result = await this.client.session.todo({
        path: { id: sessionID },
      } as Parameters<typeof this.client.session.todo>[0])

      if (!result.data) {
        return null
      }

      const todos = result.data as Todo[]

      // Scan todos for ticket pattern
      for (const todo of todos) {
        if (todo.content) {
          const ticket = this.extractFromText(todo.content)
          if (ticket) {
            return ticket
          }
        }
      }

      return null
    } catch {
      return null
    }
  }

  private extractFromText(text: string): string | null {
    const match = text.match(TICKET_PATTERN)
    return match?.[1] ?? null
  }
}
