# Contract: scenario-run-config.md Schema

**Feature**: `003-scenario-tests`  
**File path**: `tests/features/scenario-run-config.md`  
**Status**: Pre-committed to repository; read by `/tns:exec-scenarios`

---

## Purpose

`scenario-run-config.md` is the single configuration file that controls how `/tns:exec-scenarios` runs the Gherkin scenario suite. It is committed to the repository so that the test suite works out of the box without manual setup.

---

## Full File Template

```markdown
# Scenario Run Config

## testDir

tests

## executor

command: bash-shell

config:
The CLI binary is pre-built at `bin/agent-get.js` relative to the project root.
Run each CLI step with: `node <absolute-path-to-project-root>/bin/agent-get.js`

The binary must be built before running scenarios (`npm run build`).

For Claude Desktop scenarios, set the `AGENT_GET_HOME` environment variable to the
temp working directory to redirect `os.homedir()` expansions away from the real user home.
Example: `AGENT_GET_HOME="$SETUP_TMPDIR" node /abs/bin/agent-get.js install --host claude-desktop ...`

No network access is required for `@P0` and `@P1` scenarios. `@network`-tagged scenarios
require internet access and should be excluded from the default run.

## tags

not @network and not @skip

## concurrency

4

## maxFailures

10

## maxRetries

1

## 运行时注记

notes:
- Before running any scenario, ensure the CLI binary exists at `bin/agent-get.js`.
  If it does not exist, run `npm run build` first.
- The `Given` steps create a unique temp working directory via `mktemp -d`. All subsequent
  file operations happen inside this directory.
- Cursor and Claude Code detection relies on `.cursor/` or `.claude/` directories being
  present in the temp working directory. The `Given` step must create these before CLI invocation.
- For Claude Desktop scenarios, pass `AGENT_GET_HOME="$SETUP_TMPDIR"` to the CLI command
  so that the `~/Library/Application Support/Claude/` path expands relative to the temp dir.
- Assertions use standard POSIX tools: `test -f`, `cat`, `jq`, `grep`. Ensure `jq` is
  installed in the execution environment.
```

---

## Field Reference

| Field | Section Heading | Type | Required | Default |
|-------|----------------|------|----------|---------|
| `testDir` | `## testDir` | string | No | `tests` (sniffed) |
| `executor.command` | `## executor` → `command:` | string | Yes | — |
| `executor.config` | `## executor` → `config:` | free text | Yes | — |
| `tags` | `## tags` | tag expression | No | (run all) |
| `concurrency` | `## concurrency` | integer | No | `4` |
| `maxFailures` | `## maxFailures` | integer | No | `10` |
| `maxRetries` | `## maxRetries` | integer | No | `1` |
| `notes` | `## 运行时注记` → `notes:` | free text | No | — |

---

## Executor: `bash-shell`

When `executor.command` is `bash-shell`, the `/tns:exec-scenarios` command synthesizes MixedCase steps as bash commands. The exec environment for each step:

- **Working directory context**: Steps may use `$SETUP_TMPDIR` (captured from the Setup step)
- **Setup step injected**: `bash: mktemp -d /tmp/scenario-${caseId}-XXXXXX` → captured as `SETUP_TMPDIR`
- **Teardown step injected**: `bash: rm -rf "$SETUP_TMPDIR"` (always runs, even on failure)

**Step translation examples**:

| Gherkin Step | Synthesized Bash Command |
|-------------|--------------------------|
| `Given a temp working directory is created` | (handled by Setup injection) |
| `Given the MCP fixture is copied to the working directory` | `bash: cp -r <abs>/tests/fixtures/mcp/playwright.json "$SETUP_TMPDIR/"` |
| `Given a .cursor directory exists` | `bash: mkdir -p "$SETUP_TMPDIR/.cursor"` |
| `When the user installs the MCP on Cursor` | `bash: cd "$SETUP_TMPDIR" && node <abs>/bin/agent-get.js install --host cursor ./playwright.json` |
| `Then the Cursor MCP config file should exist` | `bash: test -f "$SETUP_TMPDIR/.cursor/mcp.json"` |
| `Then the MCP config should contain the server entry` | `bash: jq -e '.mcpServers.playwright' "$SETUP_TMPDIR/.cursor/mcp.json"` |

---

## Tag Filter Expression

The `tags` field follows the same syntax as the scenario list filter in `/tns:exec-scenarios`:

```
not @network and not @skip       ← default (run P0/P1/P2 excluding network + skip)
@P0                              ← only critical happy-path scenarios
@P0 or @P1                       ← P0 and P1 scenarios
@P1 and @network                 ← P1 network scenarios only
```
