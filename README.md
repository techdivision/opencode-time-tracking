# @techdivision/opencode-time-tracking

Automatic time tracking plugin for OpenCode. Tracks session duration and tool usage, writing entries to a CSV file compatible with Jira worklog sync.

## Installation

Add to your `opencode.json`:

```json
{
  "plugin": ["@techdivision/opencode-time-tracking"]
}
```

## Configuration

### 1. Project Configuration

Add the `time_tracking` section to your `.opencode/opencode-project.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/techdivision/opencode-plugins/main/schemas/opencode-project.json",
  "time_tracking": {
    "csv_file": "~/time_tracking/time-tracking.csv",
    "global_default": {
      "issue_key": "PROJ-MISC",
      "account_key": "YOUR_ACCOUNT_KEY"
    }
  }
}
```

### 2. User Email (Environment Variable)

Set your user email via the `OPENCODE_USER_EMAIL` environment variable.

Add to your `.env` file (recommended):

```env
OPENCODE_USER_EMAIL=your@email.com
```

Or export in your shell:

```bash
export OPENCODE_USER_EMAIL=your@email.com
```

If not set, the system username is used as fallback.

## Configuration Options

### Required Fields

| Field | Description |
|-------|-------------|
| `csv_file` | Path to the CSV output file (supports `~/`, absolute, or relative paths) |
| `global_default.issue_key` | Default JIRA issue key when no ticket found in context |
| `global_default.account_key` | Default Tempo account key for time entries |

### Optional Fields

#### Agent-specific Defaults

Override default ticket/account for specific agents:

```json
{
  "time_tracking": {
    "csv_file": "...",
    "global_default": {
      "issue_key": "PROJ-MISC",
      "account_key": "TD_GENERAL"
    },
    "agent_defaults": {
      "@developer": {
        "issue_key": "PROJ-DEV",
        "account_key": "TD_DEVELOPMENT"
      },
      "@reviewer": {
        "issue_key": "PROJ-REVIEW"
      }
    }
  }
}
```

#### Ignored Agents

Skip time tracking for specific agents:

```json
{
  "time_tracking": {
    "csv_file": "...",
    "global_default": { ... },
    "ignored_agents": ["@internal", "@notrack"]
  }
}
```

### Full Example

```json
{
  "$schema": "https://raw.githubusercontent.com/techdivision/opencode-plugins/main/schemas/opencode-project.json",
  "time_tracking": {
    "csv_file": "~/time_tracking/time-tracking.csv",
    "global_default": {
      "issue_key": "PROJ-MISC",
      "account_key": "TD_GENERAL"
    },
    "agent_defaults": {
      "@developer": {
        "issue_key": "PROJ-DEV",
        "account_key": "TD_DEVELOPMENT"
      },
      "@reviewer": {
        "issue_key": "PROJ-REVIEW"
      }
    },
    "ignored_agents": ["@internal"]
  }
}
```

## Fallback Hierarchy

### Ticket Resolution

1. Context ticket (from messages/todos)
2. Agent-specific `issue_key` (if configured)
3. `global_default.issue_key`

### Account Key Resolution

1. Agent-specific `account_key` (if configured)
2. `global_default.account_key`

## How it works

- Tracks tool executions during each session turn
- Extracts JIRA ticket from user messages or todos
- Writes CSV entry when session becomes idle
- Shows toast notification with tracked time

## CSV Format

```
id,start_date,end_date,user,ticket_name,issue_key,account_key,start_time,end_time,duration_seconds,tokens_used,tokens_remaining,story_points,description,notes
```

## Events

| Event | When triggered |
|-------|----------------|
| `session.idle` | After each complete AI response (including all tool calls) |
