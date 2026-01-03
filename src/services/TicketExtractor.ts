/**
 * @fileoverview Extracts Jira ticket references from session context.
 */

import type { MessageWithParts } from "../types/MessageWithParts"
import type { OpencodeClient } from "../types/OpencodeClient"
import type { Todo } from "../types/Todo"

/**
 * Regular expression pattern for Jira ticket references.
 * Matches patterns like "PROJ-123", "ABC-1", "FEATURE-9999".
 */
const TICKET_PATTERN = /([A-Z]+-\d+)/

/**
 * Extracts Jira ticket references from user messages and todos.
 *
 * @remarks
 * Scans the session context for ticket patterns in this priority:
 * 1. User messages (newest first)
 * 2. Todo items (newest first)
 *
 * Returns the first match found, allowing tickets to be updated
 * when mentioned in later messages.
 */
export class TicketExtractor {
  /** OpenCode SDK client */
  private client: OpencodeClient

  /**
   * Creates a new ticket extractor instance.
   *
   * @param client - The OpenCode SDK client
   */
  constructor(client: OpencodeClient) {
    this.client = client
  }

  /**
   * Extracts a ticket reference from the session context.
   *
   * @param sessionID - The OpenCode session identifier
   * @returns The ticket reference (e.g., "PROJ-123"), or `null` if not found
   *
   * @example
   * ```typescript
   * const ticket = await ticketExtractor.extract("session-123")
   * // Returns "PROJ-456" if user mentioned it in a message
   * ```
   */
  async extract(sessionID: string): Promise<string | null> {
    const ticketFromMessages = await this.extractFromMessages(sessionID)

    if (ticketFromMessages) {
      return ticketFromMessages
    }

    const ticketFromTodos = await this.extractFromTodos(sessionID)

    return ticketFromTodos
  }

  /**
   * Extracts a ticket from user messages.
   *
   * @param sessionID - The OpenCode session identifier
   * @returns The ticket reference, or `null` if not found
   */
  private async extractFromMessages(
    sessionID: string
  ): Promise<string | null> {
    try {
      const result = await this.client.session.messages({
        path: { id: sessionID },
      } as Parameters<typeof this.client.session.messages>[0])

      if (!result.data) {
        return null
      }

      const messages = result.data as MessageWithParts[]

      // Scan user messages for ticket pattern (newest first)
      for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i]

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

  /**
   * Extracts a ticket from todo items.
   *
   * @param sessionID - The OpenCode session identifier
   * @returns The ticket reference, or `null` if not found
   */
  private async extractFromTodos(sessionID: string): Promise<string | null> {
    try {
      const result = await this.client.session.todo({
        path: { id: sessionID },
      } as Parameters<typeof this.client.session.todo>[0])

      if (!result.data) {
        return null
      }

      const todos = result.data as Todo[]

      // Scan todos for ticket pattern (newest first)
      for (let i = todos.length - 1; i >= 0; i--) {
        const todo = todos[i]

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

  /**
   * Extracts a ticket pattern from text.
   *
   * @param text - The text to search
   * @returns The first ticket match, or `null` if not found
   */
  private extractFromText(text: string): string | null {
    const match = text.match(TICKET_PATTERN)

    return match?.[1] ?? null
  }
}
