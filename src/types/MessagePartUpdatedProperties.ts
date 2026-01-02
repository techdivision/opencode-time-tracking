import type { StepFinishPart } from "./StepFinishPart"

export interface MessagePartUpdatedProperties {
  part: {
    type: string
    sessionID?: string
    tokens?: StepFinishPart["tokens"]
  }
}
