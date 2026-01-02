# opencode-time-tracking

Automatic time tracking plugin for OpenCode. Tracks session duration and tool usage, writing entries to a CSV file compatible with Jira worklog sync.

## Installation

Add to your `opencode.json`:

```json
{
  "plugin": ["opencode-time-tracking"]
}
```

## Configuration

Create `.opencode/time-tracking.json` in your project:

```json
{
  "csv_file": "~/time_tracking/time-tracking.csv",
  "user_email": "your@email.com",
  "default_account_key": "YOUR_ACCOUNT_KEY"
}
```

## How it works

- Tracks tool executions during each session turn
- Extracts JIRA ticket from git branch name (e.g., `feature/PROJ-123-description`)
- Writes CSV entry when session becomes idle (after each complete response)
- Shows toast notification with tracked time

## CSV Format

```
id,start_date,end_date,user,ticket_name,issue_key,account_key,start_time,end_time,duration_seconds,tokens_used,tokens_remaining,story_points,description,notes
```

## Events

| Event | When triggered |
|-------|----------------|
| `session.idle` | After each complete AI response (including all tool calls) |
| `session.deleted` | When a session is explicitly deleted |
