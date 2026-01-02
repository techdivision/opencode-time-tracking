export interface StepFinishPart {
  type: "step-finish"
  sessionID: string
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: {
      read: number
      write: number
    }
  }
}
