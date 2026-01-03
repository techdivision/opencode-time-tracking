# AGENTS.md - OpenCode Time Tracking Plugin

Guidelines for AI agents working in this repository.

## Project Overview

OpenCode plugin that automatically tracks session duration, tool usage, and token consumption, exporting data to CSV for time tracking integration (e.g., Jira/Tempo).

## Build & Development Commands

```bash
# Install dependencies
npm install

# Type check (no emit)
npx tsc --noEmit

# Watch mode for development
npx tsc --noEmit --watch
```

**Note:** This is a Bun-based plugin. No build step required - TypeScript files are loaded directly by OpenCode at runtime.

## Project Structure

```
src/
├── Plugin.ts                 # Main entry point, exports plugin
├── hooks/                    # OpenCode hook implementations
│   ├── EventHook.ts          # Session events (idle, deleted, token tracking)
│   └── ToolExecuteAfterHook.ts  # Tool execution tracking
├── services/                 # Business logic classes
│   ├── ConfigLoader.ts       # Load plugin configuration
│   ├── CsvWriter.ts          # CSV file output
│   ├── SessionManager.ts     # Session state management
│   └── TicketExtractor.ts    # Extract tickets from messages/todos
├── types/                    # TypeScript interfaces (one per file)
│   ├── ActivityData.ts
│   ├── SessionData.ts
│   ├── TokenUsage.ts
│   └── ...
└── utils/                    # Utility classes
    ├── CsvFormatter.ts       # CSV formatting helpers
    └── DescriptionGenerator.ts  # Generate activity descriptions
```

## Code Style Guidelines

### File Organization

**CRITICAL: One class/interface/function per file using PascalCase naming.**

```
# Good
src/types/TokenUsage.ts       → export interface TokenUsage
src/services/SessionManager.ts → export class SessionManager
src/hooks/EventHook.ts        → export function createEventHook

# Bad - multiple exports in one file
src/types/index.ts            → export interface A, B, C  // NO!
```

### Imports

- Use `import type` for type-only imports
- Group imports: external packages first, then internal modules
- Use relative paths for internal imports

```typescript
// External packages first
import type { Plugin, Hooks, PluginInput } from "@opencode-ai/plugin"
import type { Event } from "@opencode-ai/sdk"

// Internal imports
import type { SessionManager } from "../services/SessionManager"
import { DescriptionGenerator } from "../utils/DescriptionGenerator"
```

### TypeScript

- Strict mode enabled (`"strict": true`)
- Target: ESNext
- Module resolution: bundler
- No emit - TypeScript is for type checking only
- Explicit return types on public methods
- Use `interface` for object shapes, `type` for unions/aliases

```typescript
// Interface for object shapes
export interface TokenUsage {
  input: number
  output: number
}

// Type for unions or derived types
type OpencodeClient = ReturnType<typeof createOpencodeClient>
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | PascalCase | `SessionManager.ts` |
| Classes | PascalCase | `class SessionManager` |
| Interfaces | PascalCase | `interface TokenUsage` |
| Functions | camelCase | `createEventHook()` |
| Variables | camelCase | `sessionManager` |
| Constants | UPPER_SNAKE_CASE | `TICKET_PATTERN` |
| Private members | camelCase with `private` | `private sessions` |

### Error Handling

- Use try/catch with empty catch blocks for graceful degradation
- Return `null` on failure rather than throwing
- Log errors via toast notifications to user

```typescript
try {
  const result = await client.session.messages(...)
  // ...
} catch {
  return null  // Graceful fallback
}
```

### Class Structure

```typescript
export class ServiceName {
  // Private fields first
  private client: OpencodeClient

  // Constructor
  constructor(client: OpencodeClient) {
    this.client = client
  }

  // Public methods
  async publicMethod(): Promise<string | null> {
    // ...
  }

  // Private methods last
  private helperMethod(): void {
    // ...
  }
}
```

### Hook Factory Pattern

Hooks are created via factory functions that receive dependencies:

```typescript
export function createEventHook(
  sessionManager: SessionManager,
  csvWriter: CsvWriter,
  client: OpencodeClient
) {
  return async ({ event }: { event: Event }): Promise<void> => {
    // Hook implementation
  }
}
```

## OpenCode SDK Usage

### Client API Calls

Use `path` parameter for session-specific endpoints:

```typescript
// Correct
const result = await client.session.messages({
  path: { id: sessionID },
} as Parameters<typeof client.session.messages>[0])

// Access data
const messages = result.data as MessageWithParts[]
```

### Plugin Export

Must export a named `plugin` constant:

```typescript
export const plugin: Plugin = async ({ client, directory }: PluginInput): Promise<Hooks> => {
  return {
    "tool.execute.after": createToolExecuteAfterHook(...),
    event: createEventHook(...),
  }
}

export default plugin
```

## Configuration

Plugin config file: `.opencode/time-tracking.json`

```json
{
  "csv_file": "~/worklogs/time.csv",
  "user_email": "user@example.com",
  "default_account_key": "ACCOUNT-1"
}
```

## Git Workflow (Gitflow)

This project follows **Gitflow**:

- **main**: Production-ready releases only
- **develop**: Integration branch for features
- Feature branches: `feature/<name>` (branch from `develop`)
- Release branches: `release/<version>` (branch from `develop`)
- Hotfix branches: `hotfix/<name>` (branch from `main`)

### Release Process

**CRITICAL: When creating a new release, ALWAYS:**

1. Update `version` in `package.json`
2. Commit the version bump
3. Merge `develop` into `main`
4. Create annotated tag: `git tag -a vX.Y.Z -m "vX.Y.Z - Description"`
5. Push both branches and tag

```bash
# Example release workflow
git checkout develop
# ... make changes ...
git add . && git commit -m "Your changes"

# Update version in package.json
# Edit package.json: "version": "X.Y.Z"
git add package.json && git commit -m "Bump version to X.Y.Z"

# Merge to main and tag
git checkout main
git merge develop
git tag -a vX.Y.Z -m "vX.Y.Z - Release description"

# Push everything
git push origin main develop
git push origin vX.Y.Z
```
