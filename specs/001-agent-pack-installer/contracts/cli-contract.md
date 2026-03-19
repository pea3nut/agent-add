# CLI Contract: agent-get

**Branch**: `001-agent-pack-installer` | **Date**: 2026-03-17

This document defines the external contract of the `agent-get` CLI — the user-facing interface that must remain stable and be regression-tested via contract tests (`tests/contract/`).

---

## Command Signature

```
agent-get [options]

Options:
  --pack <source>        Install all assets from an Agent Pack Manifest JSON
  --mcp <source>         Install an MCP server
  --skill <source>       Install a Skill
  --prompt <source>      Install a Prompt (appends to host's base rules file)
  --command <source>     Install a Command
  --sub-agent <source>   Install a Sub-agent
  --host <host>          Target host ID (cursor | claude-code | claude-desktop)
  -V, --version          Output the version number
  -h, --help             Display help for command
```

**Combination rules**:
- All flags are optional; at least one asset flag (`--pack`, `--mcp`, `--skill`, `--prompt`, `--command`, `--sub-agent`) MUST be provided
- All flags can be combined freely in any order
- The same flag can be repeated: `--skill a --skill b` installs both
- `--pack` and individual asset flags can be combined: Pack assets + extra assets are all installed
- `--host` is optional in TTY environments (interactive selection presented); **required in non-TTY environments** (CI, pipes) — omitting it causes exit 2

**Non-TTY behavior**: When `process.stdout.isTTY === false` and `--host` is not provided, the CLI exits immediately with code 2 and prints:
```
agent-get error: Non-interactive environment detected. Please specify a host with --host <host>.
  Valid hosts: cursor, claude-code, claude-desktop
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All requested assets installed successfully (including `exists` status — idempotent re-run) |
| `1` | Partial failure: at least one asset resulted in `conflict` or `error`; other assets may have succeeded |
| `2` | Fatal error: Manifest parse failure, no asset flags provided, unreachable source, unrecoverable I/O error, **or `--host` omitted in non-TTY environment** |

---

## Stdout Contract

### Install Summary Format

Every successful run (exit 0 or 1) MUST output a structured summary:

```
agent-get — Install Summary
Host: Cursor (.cursor/)

  ✓ written   mcp/playwright      → .cursor/mcp.json (mcpServers.playwright)
  ✓ written   skill/e2e-guide     → .cursor/skills/e2e-guide/SKILL.md
  ✓ written   prompt/dev-pract…   → AGENTS.md
  ✓ written   command/init        → .cursor/commands/init.md
  ✓ written   sub-agent/reviewer  → .cursor/agents/code-reviewer.md
  ─ skipped   (none)
  ✗ conflict  (none)

5 written · 0 skipped · 0 conflicts
```

**Status symbols**:
- `✓ written` — newly installed
- `≡ exists` — already installed, no change needed
- `↑ updated` — re-installed with new content
- `─ skipped` — host does not support this asset type
- `✗ conflict` — target exists with user modifications; not overwritten
- `✗ error` — installation failed with error message below

**Conflict detail line** (appended after summary table for each conflict):
```
  ! conflict: mcp/playwright — .cursor/mcp.json already has a 'playwright' key with different content.
              To override, remove the existing key and re-run.
```

---

## Stderr Contract

All diagnostic output (progress, warnings, debug) goes to stderr.

Errors use this format:
```
agent-get error: <human-readable message>
  Source: <original source string>
  Cause:  <underlying error, e.g. "ENOENT: no such file or directory">
  Fix:    <actionable suggestion>
```

Fatal errors (exit 2) print to stderr and exit immediately without printing a summary.

---

## `--help` Output Contract

The `--help` output is a contract tested by `tests/contract/cli.test.ts`. It MUST match the spec snapshot in `spec.md` § "CLI 命令面（终态）".

Snapshot file: `tests/contract/__snapshots__/help-output.snap`

---

## `--version` Output Contract

```
<semver>
```

e.g. `0.1.0`. No prefix (`v0.1.0` is NOT allowed per contract test).

---

## Host IDs

Valid values for `--host`:

| Value | Host |
|-------|------|
| `cursor` | Cursor IDE |
| `claude-code` | Claude Code |
| `claude-desktop` | Claude Desktop |

Passing an unrecognized host ID → exit 2 with error message listing valid IDs.

---

## Source URI Formats

| URI Type | Detection Rule | Example |
|----------|---------------|---------|
| Local path | Starts with `./`, `../`, or `/` | `./mcps/playwright.json` |
| Git SSH | Starts with `git@` | `git@github.com:org/repo.git#path/to/asset` |
| Git HTTPS | Starts with `https://` AND (contains `.git` OR contains `#`) | `https://github.com/org/repo.git#path` |
| Direct HTTP(S) file | Starts with `https://` or `http://`, no `.git`, no `#` | `https://example.com/playwright.json` |

**Direct HTTP(S) file** fetches a single file via HTTP GET. Suitable for single-file assets (MCP JSON, Prompt/Command/SubAgent `.md`). Not suitable for Skill (requires directory structure).

**Pre-install validation**: Before any writes, the installer validates source content matches the declared asset type:
- `--skill`: resolved directory MUST contain `SKILL.md`; otherwise exit 2 with message explaining expected structure
- All other types: resolved file MUST exist and match expected extension

Unrecognized URI format → exit 2 with error.

---

## Manifest JSON Schema Contract

The `--pack` source must resolve to a JSON file matching this schema:

```json
{
  "name": "namespace/pack-name",
  "assets": [
    {
      "type": "mcp | skill | prompt | command | subAgent",
      "source": "<uri> or [<uri>, ...]"
    }
  ]
}
```

Asset name is **not declared in the Manifest**; it is inferred by the installer from the source path (e.g., `./mcps/playwright.json` → `playwright`).

**Validation errors** (exit 2):
- Missing required fields → `"Manifest missing required field: <field>"`
- Unsupported `type` value → `"Unsupported asset type: '<value>'. Supported: mcp, skill, prompt, command, subAgent"`
- `name` (pack name) format invalid → `"Manifest name must match namespace/pack-name format"`

---

## Sub-agent `agent-get/*` Field Contract

Sub-agent source files may contain `agent-get/<host>/<field>` YAML frontmatter fields. The installer:

1. Reads `agent-get/<hostId>/<field>` values
2. In the **written copy** only: sets `<field>` to the hint value
3. Strips all `agent-get/*` keys from the written copy
4. Never modifies the source file

**Example transformation** (source → Cursor copy):

```yaml
# Source (unchanged)              # Written to .cursor/agents/code-reviewer.md
---                                ---
name: code-reviewer                name: code-reviewer
model: inherit         →           model: fast
agent-get/cursor/model: fast         description: Code review specialist
agent-get/claude-code/model: haiku   ---
description: Code review specialist
---
```
