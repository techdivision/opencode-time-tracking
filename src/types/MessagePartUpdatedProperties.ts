/**
 * @fileoverview Properties for message.part.updated events.
 */

import type { StepFinishPart } from "./StepFinishPart"

/**
 * Properties received with message.part.updated events.
 */
export interface MessagePartUpdatedProperties {
  /** The updated message part */
  part: {
    /** The type of the part */
    type: string

    /** Session ID (present on step-finish parts) */
    sessionID?: string

    /** Token usage (present on step-finish parts) */
    tokens?: StepFinishPart["tokens"]
  }
}
