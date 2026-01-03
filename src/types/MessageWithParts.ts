import type { MessageInfo } from "./MessageInfo"
import type { MessagePart } from "./MessagePart"

export interface MessageWithParts {
  info: MessageInfo
  parts: MessagePart[]
}
