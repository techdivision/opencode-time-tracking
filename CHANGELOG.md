# Changelog

All notable changes to this project will be documented in this file.

## [0.7.1] - 2025-03-01

### Fixed

- Fix `agent_defaults` lookup to be tolerant of `@` prefix in agent names
- Add `AgentMatcher` utility for consistent agent name normalization across the codebase

## [0.7.0] - 2025-02-04

### Added

- Add `valid_projects` configuration for JIRA project whitelist
- Restrict ticket detection to specific projects when configured

### Changed

- Default ticket pattern now requires at least 2 uppercase letters
- Matches: `PROJ-123`, `SOSO-1`, `AB-99`
- Does not match: `V-1`, `X-9` (single letter), `UTF-8` (false positive)

## [0.6.1] - 2025-02-02

### Fixed

- Fix `ignored_agents` matching to accept agent names with or without `@` prefix
- Both `"time-tracking"` and `"@time-tracking"` now work in configuration

## [0.6.0] - 2025-01-31

### Breaking Changes

- **Config:** `default_account_key` removed from top-level config
- **Config:** `global_default` is now required (was optional)
- **Config:** `global_default.account_key` is now required (was optional)

### Migration

Update your `.opencode/opencode-project.json`:

**Before (0.5.x):**
```json
{
  "time_tracking": {
    "csv_file": "...",
    "default_account_key": "TD_KS_1100",
    "global_default": {
      "issue_key": "PROJ-123"
    }
  }
}
```

**After (0.6.0):**
```json
{
  "time_tracking": {
    "csv_file": "...",
    "global_default": {
      "issue_key": "PROJ-123",
      "account_key": "TD_KS_1100"
    }
  }
}
```

Run `/time-tracking.init` to automatically migrate your configuration.

## [0.5.0] - 2025-01-28

### Added

- Initial release
- Automatic session tracking with ticket extraction
- CSV export for time entries
- Agent-specific default tickets
- Global fallback configuration
- Ignored agents support
