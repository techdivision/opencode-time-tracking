/**
 * @fileoverview Message part type from OpenCode SDK.
 */

/**
 * A part of a message (text, file, tool call, etc.).
 */
export interface MessagePart {
  /** The type of the part (e.g., "text", "tool", "file") */
  type: string

  /** Text content for text parts */
  text?: string
}
