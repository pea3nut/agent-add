# CLI Contract: agent-get (002-more-hosts delta)

**Feature**: `002-more-hosts`  
**Date**: 2026-03-17  
**Stability**: Stable (public CLI surface)

---

## Overview

This document describes the CLI interface exposed to end-users, including the extended `--host` flag values introduced in this feature and the new error behavior when an explicit asset flag is used with an unsupported host.

The existing CLI signature is **unchanged**. This feature only adds valid `--host` values and new error paths.

---

## Command Syntax

```
agent-get [asset-flags...] [--host <id>] [--force]

agent-get --mcp      <source>  [--host <id>]
agent-get --skill    <source>  [--host <id>]
agent-get --prompt   <source>  [--host <id>]
agent-get --command  <source>  [--host <id>]
agent-get --sub-agent <source> [--host <id>]
agent-get --pack     <source>  [--host <id>]
```

Multiple asset flags may be combined in a single invocation.

---

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--mcp <source>` | string (repeatable) | Install MCP server config from `<source>` |
| `--skill <source>` | string (repeatable) | Install Skill asset from `<source>` |
| `--prompt <source>` | string (repeatable) | Install Prompt/Rules asset from `<source>` |
| `--command <source>` | string (repeatable) | Install Command asset from `<source>` |
| `--sub-agent <source>` | string (repeatable) | Install Sub-agent asset from `<source>` |
| `--pack <source>` | string (repeatable) | Install all assets declared in an agent-pack manifest |
| `--host <id>` | string | Target host identifier (see table below) |
| `--force` | boolean | Overwrite existing files without prompting |

### `<source>` Formats

- Local file path: `./playwright.json`, `../skills/e2e-guide`
- HTTPS URL to raw file: `https://raw.githubusercontent.com/.../SKILL.md`
- Git repository URL: `https://github.com/org/repo`

---

## `--host` Valid Values (expanded by this feature)

### Existing (v0.0.0)

| ID | Display Name |
|----|-------------|
| `cursor` | Cursor |
| `claude-code` | Claude Code |
| `claude-desktop` | Claude Desktop |

### Group 1 — New in this feature

| ID | Display Name |
|----|-------------|
| `windsurf` | Windsurf |
| `github-copilot` | GitHub Copilot |
| `gemini` | Gemini CLI |
| `roo-code` | Roo Code |
| `kilo-code` | Kilo Code |
| `qwen-code` | Qwen Code |
| `opencode` | opencode |
| `augment` | Augment |
| `kiro` | Kiro CLI |
| `tabnine` | Tabnine CLI |
| `kimi` | Kimi Code |
| `trae` | Trae |
| `openclaw` | OpenClaw |

### Group 2 — New in this feature (TOML MCP)

| ID | Display Name |
|----|-------------|
| `codex` | Codex CLI |
| `vibe` | Mistral Vibe |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All assets installed (or already present) successfully |
| `2` | Fatal error — no assets were written. Causes include: unknown `--host` value, explicit asset flag used with unsupported host, source validation failure |

---

## Error Messages

All error messages are in **English**.

### Unknown host

```
Error: Unknown host identifier 'jules'.

Supported hosts: cursor, claude-code, claude-desktop, windsurf, github-copilot, gemini,
  roo-code, kilo-code, qwen-code, opencode, augment, kiro, tabnine, kimi, trae, openclaw,
  codex, vibe

• View the full host capability matrix: https://github.com/pea3nut/agent-get/blob/main/src/hosts/README.md
```

Exit code: **2**

### Explicit asset flag + unsupported host (with `reason`)

```
Error: Host "windsurf" does not support asset type "command".

Reason: Windsurf does not have a custom slash command mechanism equivalent to Command.

• View the full host capability matrix: https://github.com/pea3nut/agent-get/blob/main/src/hosts/README.md
• If you believe Windsurf now supports this, feel free to open a PR: https://github.com/pea3nut/agent-get/pulls
```

Exit code: **2**

### Explicit asset flag + unsupported host (no `reason` field)

```
Error: Host "gemini" does not support asset type "skill".

Reason: This asset type is not supported by this host.

• View the full host capability matrix: https://github.com/pea3nut/agent-get/blob/main/src/hosts/README.md
• If you believe Gemini CLI now supports this, feel free to open a PR: https://github.com/pea3nut/agent-get/pulls
```

Exit code: **2**

### `--pack` with unsupported asset type (skip — unchanged behavior)

No error is emitted; the unsupported asset is silently skipped and the install summary includes:

```
⏭  Skipped: command "init.md" — Windsurf does not have a custom slash command mechanism equivalent to Command.
```

---

## Install Summary Output (stdout)

Unchanged from v0.0.0 format. Example for new hosts:

```
✅  MCP "playwright" installed → ~/.codeium/windsurf/mcp_config.json
✅  Prompt "team-rules" installed → .windsurf/rules/team-rules.md
⏭  Skipped: command "init.md" — [reason]
```

---

## Behavioral Constraints

1. **Atomicity**: Each file write is atomic (write to temp, rename). Partial writes on crash are not observable.
2. **Idempotency**: Re-running the same command produces `already installed` / `skipped` status, never duplicates content.
3. **No partial install on rejection**: When exit 2 is triggered by unsupported asset type, zero files are written for that invocation.
4. **`--pack` skip is not an error**: Pack-sourced assets that hit unsupported capabilities are summarized but do not affect exit code.
5. **TOML idempotency**: Codex `[mcp_servers.<name>]` and Vibe `[[mcp_servers]]` entries are not duplicated on re-run.
