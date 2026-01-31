# Changelog

All notable changes to this project will be documented in this file.

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
