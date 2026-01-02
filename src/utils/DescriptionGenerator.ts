import type { ActivityData } from "../types/ActivityData"

export class DescriptionGenerator {
  static generate(activities: ActivityData[]): string {
    if (activities.length === 0) return "No activities tracked"

    const toolCounts = activities.reduce(
      (acc, a) => {
        acc[a.tool] = (acc[a.tool] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const filesWorkedOn = new Set<string>()
    for (const activity of activities) {
      if (activity.file) {
        const fileName = activity.file.split("/").pop() || activity.file
        filesWorkedOn.add(fileName)
      }
    }

    const mainActivities: string[] = []

    if (toolCounts.edit || toolCounts.write) {
      mainActivities.push(
        `${(toolCounts.edit || 0) + (toolCounts.write || 0)} file edit(s)`
      )
    }
    if (toolCounts.read) {
      mainActivities.push(`${toolCounts.read} file read(s)`)
    }
    if (toolCounts.bash) {
      mainActivities.push(`${toolCounts.bash} command(s)`)
    }
    if (toolCounts.glob || toolCounts.grep) {
      mainActivities.push(
        `${(toolCounts.glob || 0) + (toolCounts.grep || 0)} search(es)`
      )
    }

    let description =
      mainActivities.length > 0
        ? mainActivities.join(", ")
        : `${activities.length} tool call(s)`

    if (filesWorkedOn.size > 0 && filesWorkedOn.size <= 5) {
      description += ` - Files: ${Array.from(filesWorkedOn).join(", ")}`
    } else if (filesWorkedOn.size > 5) {
      description += ` - ${filesWorkedOn.size} files`
    }

    return description
  }

  static generateToolSummary(activities: ActivityData[]): string {
    const toolCounts = activities.reduce(
      (acc, a) => {
        acc[a.tool] = (acc[a.tool] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return Object.entries(toolCounts)
      .map(([t, c]) => `${t}(${c}x)`)
      .join(", ")
  }
}
