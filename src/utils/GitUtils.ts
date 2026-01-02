import type { PluginInput } from "@opencode-ai/plugin"

type BunShell = PluginInput["$"]

export class GitUtils {
  private $: BunShell

  constructor(shell: BunShell) {
    this.$ = shell
  }

  async extractTicket(): Promise<string | null> {
    try {
      const branch = await this.$`git branch --show-current`.text()
      const match = branch.trim().match(/([A-Z]+-\d+)/)
      return match?.[1] ?? null
    } catch {
      return null
    }
  }
}
