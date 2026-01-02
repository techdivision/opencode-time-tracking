import type { Plugin, Hooks } from "@opencode-ai/plugin"
import { randomUUID } from "crypto"
import { mkdir } from "fs/promises"
import { dirname } from "path"

interface TimeTrackingConfig {
  csv_file: string
  user_email: string
  default_account_key: string
}

interface ActivityData {
  tool: string
  timestamp: number
  file?: string
}

interface SessionData {
  ticket: string | null
  startTime: number
  activities: ActivityData[]
}

export const plugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  const configPath = `${directory}/.opencode/time-tracking.json`
  let config: TimeTrackingConfig | null = null

  try {
    const file = Bun.file(configPath)
    if (await file.exists()) {
      config = await file.json()
    } else {
      return {}
    }
  } catch {
    return {}
  }

  async function extractTicket(): Promise<string | null> {
    try {
      const branch = await $`git branch --show-current`.text()
      const match = branch.trim().match(/([A-Z]+-\d+)/)
      return match?.[1] ?? null
    } catch {
      return null
    }
  }

  function escapeCSV(value: string): string {
    return value.replace(/"/g, '""')
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toISOString().split('T')[0]
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toTimeString().split(' ')[0]
  }

  function generateDescription(activities: ActivityData[]): string {
    if (activities.length === 0) return "No activities tracked"

    const toolCounts = activities.reduce((acc, a) => {
      acc[a.tool] = (acc[a.tool] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const filesWorkedOn = new Set<string>()
    for (const activity of activities) {
      if (activity.file) {
        const fileName = activity.file.split('/').pop() || activity.file
        filesWorkedOn.add(fileName)
      }
    }

    const mainActivities: string[] = []

    if (toolCounts.edit || toolCounts.write) {
      mainActivities.push(`${(toolCounts.edit || 0) + (toolCounts.write || 0)} file edit(s)`)
    }
    if (toolCounts.read) {
      mainActivities.push(`${toolCounts.read} file read(s)`)
    }
    if (toolCounts.bash) {
      mainActivities.push(`${toolCounts.bash} command(s)`)
    }
    if (toolCounts.glob || toolCounts.grep) {
      mainActivities.push(`${(toolCounts.glob || 0) + (toolCounts.grep || 0)} search(es)`)
    }

    let description = mainActivities.length > 0
      ? mainActivities.join(', ')
      : `${activities.length} tool call(s)`

    if (filesWorkedOn.size > 0 && filesWorkedOn.size <= 5) {
      description += ` - Files: ${Array.from(filesWorkedOn).join(', ')}`
    } else if (filesWorkedOn.size > 5) {
      description += ` - ${filesWorkedOn.size} files`
    }

    return description
  }

  const CSV_HEADER = 'id,start_date,end_date,user,ticket_name,issue_key,account_key,start_time,end_time,duration_seconds,tokens_used,tokens_remaining,story_points,description,notes'

  async function writeCSVEntry(data: {
    ticket: string | null
    startTime: number
    endTime: number
    durationSeconds: number
    description: string
    notes: string
  }): Promise<void> {
    if (!config) return

    let csvPath = config.csv_file
    if (csvPath.startsWith('~/')) {
      csvPath = csvPath.replace('~', process.env.HOME || '')
    } else if (!csvPath.startsWith('/')) {
      csvPath = `${directory}/${csvPath}`
    }

    try {
      await mkdir(dirname(csvPath), { recursive: true })
    } catch {
      // ignore
    }

    const file = Bun.file(csvPath)
    const exists = await file.exists()

    const fields = [
      randomUUID(),
      formatDate(data.startTime),
      formatDate(data.endTime),
      config.user_email,
      '',
      data.ticket ?? '',
      config.default_account_key,
      formatTime(data.startTime),
      formatTime(data.endTime),
      data.durationSeconds.toString(),
      '',
      '',
      '',
      escapeCSV(data.description),
      escapeCSV(data.notes)
    ]

    const csvLine = fields.map(f => `"${f}"`).join(',')

    if (!exists) {
      await Bun.write(csvPath, CSV_HEADER + '\n' + csvLine + '\n')
    } else {
      const content = await file.text()
      await Bun.write(csvPath, content + csvLine + '\n')
    }
  }

  const sessions = new Map<string, SessionData>()

  const hooks: Hooks = {
    "tool.execute.after": async (input, output) => {
      const { tool, sessionID } = input
      const { title, metadata } = output

      if (!sessions.has(sessionID)) {
        const ticket = await extractTicket()
        sessions.set(sessionID, {
          ticket,
          startTime: Date.now(),
          activities: []
        })
      }

      const session = sessions.get(sessionID)!

      let file: string | undefined
      if (metadata) {
        const meta = metadata as Record<string, unknown>
        file = (meta.filePath || meta.filepath || meta.file) as string | undefined
        if (!file && meta.filediff) {
          file = (meta.filediff as Record<string, unknown>).file as string | undefined
        }
      }
      if (!file && title) {
        file = title
      }

      session.activities.push({ tool, timestamp: Date.now(), file })
    },

    event: async ({ event }) => {
      if (event.type === "session.idle" || event.type === "session.deleted") {
        const props = event.properties as { sessionID?: string }
        const sessionID = props.sessionID

        if (!sessionID) return

        const session = sessions.get(sessionID)
        if (!session || session.activities.length === 0) {
          sessions.delete(sessionID)
          return
        }

        const endTime = Date.now()
        const durationSeconds = Math.round((endTime - session.startTime) / 1000)
        const description = generateDescription(session.activities)

        const toolCounts = session.activities.reduce((acc, a) => {
          acc[a.tool] = (acc[a.tool] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const toolSummary = Object.entries(toolCounts)
          .map(([t, c]) => `${t}(${c}x)`)
          .join(', ')

        try {
          await writeCSVEntry({
            ticket: session.ticket,
            startTime: session.startTime,
            endTime,
            durationSeconds,
            description,
            notes: `Auto-tracked: ${toolSummary}`
          })

          const minutes = Math.round(durationSeconds / 60)
          await client.tui.showToast({
            body: {
              message: `Time tracked: ${minutes} min${session.ticket ? ` for ${session.ticket}` : ''}`,
              variant: "success"
            }
          })
        } catch {
          await client.tui.showToast({
            body: {
              message: "Time Tracking: Failed to save entry",
              variant: "error"
            }
          })
        }

        sessions.delete(sessionID)
      }
    }
  }

  return hooks
}

export default plugin
