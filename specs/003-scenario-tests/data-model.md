# Data Model: Scenario Tests 测试体系

**Feature**: `003-scenario-tests`  
**Date**: 2026-03-17

This document describes the entities, their structure, and relationships for the Scenario Tests layer.

---

## Entity: FeatureFile

A Gherkin `.feature` file stored under `tests/features/`. Contains one or more Scenarios.

| Field | Type | Constraints |
|-------|------|-------------|
| `path` | `string` | Relative to project root; must be under `tests/features/core/` or `tests/features/host/` |
| `name` | `string` | Unique within its parent directory; kebab-case; matches file name |
| `scenarios` | `Scenario[]` | At least 1; order matters (idempotency scenarios last within each file) |
| `language` | `"en"` | All committed feature files MUST be English |

**Validation Rules**:
- Core files: exactly 7 files in `tests/features/core/` — `cli-basic`, `mcp`, `skill`, `prompt`, `command`, `sub-agent`, `pack`
- Host files: one file per supported host in `tests/features/host/`
- Idempotency scenarios (`exists`, `conflict`, `updated`) MUST appear at the end of each core asset-type file, NOT in a separate `idempotency.feature`

---

## Entity: Scenario

A single test case within a FeatureFile. Maps to one business behavior or boundary condition.

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | `string` | Unique within the feature file; English; descriptive of observable behavior |
| `tags` | `Tag[]` | At least one priority tag (`@P0`, `@P1`, or `@P2`); optionally `@network`, `@skip`, `@flaky` |
| `steps` | `Step[]` | 3–10 steps; must include at least one `Given`, one `When`, one `Then` |

**Tag Semantics**:

| Tag | Meaning |
|-----|---------|
| `@P0` | Core happy path (normal install succeeds) |
| `@P1` | Core edge/error/idempotency OR host Cursor/Claude Code basic install |
| `@P2` | Host non-popular (Claude Desktop, etc.) basic install |
| `@network` | Requires internet access; excluded from default run |
| `@skip` | Temporarily disabled |
| `@flaky` | Known unstable; retry-eligible |

---

## Entity: Step

One Gherkin step within a Scenario. Maps to one bash command or assertion during execution.

| Field | Type | Constraints |
|-------|------|-------------|
| `keyword` | `"Given" \| "When" \| "Then" \| "And" \| "But"` | Standard Gherkin keywords |
| `text` | `string` | English; concrete and observable; no implementation details |

**Step Conventions**:

| Keyword | Usage Convention |
|---------|------------------|
| `Given` | Set up temp working directory; copy fixture files into it |
| `Given` | Create required parent directories (e.g., `.cursor/`) for detection |
| `When` | Run CLI: `node <abs-path>/bin/agent-get.js install --host <host> [args]` |
| `Then` | Assert file-system state (file exists, JSON key present, content matches) |
| `And` | Continue `Given`/`When`/`Then` logic with additional steps |

**Execution Constraints** (from FR-012, FR-013):
- `When` steps MUST use the compiled binary: `node <abs-path>/bin/agent-get.js`  
- `Then` steps MUST assert via file-system checks (e.g., `test -f`, `jq`, `grep`)  
- Steps MUST NOT call internal module APIs or test framework utilities

---

## Entity: Fixture

A static test data file in `tests/fixtures/`. Copied to a temp working directory by `Given` steps.

| Field | Type | Constraints |
|-------|------|-------------|
| `path` | `string` | Relative to `tests/fixtures/`; matches asset type subdirectory |
| `assetType` | `AssetType` | One of: `mcp`, `skill`, `prompt`, `command`, `subAgent`, `pack` |
| `valid` | `boolean` | Whether the fixture is a valid input (some are intentionally invalid for error-path tests) |

**Fixture Inventory**:

| Path | Asset Type | Valid | Purpose |
|------|-----------|-------|---------|
| `mcp/playwright.json` | mcp | ✅ | Valid MCP server config (command + args) |
| `skill/my-skill/SKILL.md` | skill | ✅ | Valid skill directory with SKILL.md entry |
| `skill/bad-skill/README.md` | skill | ❌ | Invalid skill directory (no SKILL.md) |
| `prompt/my-prompt.md` | prompt | ✅ | Prompt markdown text |
| `command/my-command.md` | command | ✅ | Command markdown text |
| `sub-agent/my-agent.md` | subAgent | ✅ | Sub-agent markdown with `agent-get/*` fields |
| `pack/manifest.json` | pack | ✅ | Complete pack manifest (all 6 asset types, local paths) |

**Validation Rules**:
- Fixture files MUST NOT be modified during test execution (read-only)
- `Given` steps MUST copy fixtures to the temp working directory before CLI invocation (FR-010)

---

## Entity: TempWorkingDirectory

An ephemeral directory created per Scenario by the exec-scenarios.md `bash-shell` Setup step.

| Field | Type | Notes |
|-------|------|-------|
| `path` | `string` | Absolute path; created by `mktemp -d`; unique per scenario run |
| `lifecycle` | `"setup" → "active" → "teardown"` | Created in Setup, cleaned in Teardown (try/finally semantics) |

**Usage Patterns**:

| Host | Directory Structure Seeded in Temp Dir |
|------|----------------------------------------|
| Cursor | `.cursor/` (triggers host auto-detection when present) |
| Claude Code | `.claude/` (triggers host auto-detection) |
| Claude Desktop | No subdirectory needed; `AGENT_GET_HOME=$TMPDIR` redirects `~/` expansions |

---

## Entity: ScenarioRunConfig

The `tests/features/scenario-run-config.md` file pre-committed to the repository. Configures execution parameters for `/tns:exec-scenarios`.

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `testDir` | `string` | `"tests"` | Root directory for test discovery |
| `executor.command` | `string` | `"bash-shell"` | Executor type |
| `executor.config` | `string` (free text) | See contract | Describes CLI binary path and env var usage |
| `concurrency` | `number` | `4` | Max parallel scenarios |
| `maxFailures` | `number` | `10` | Stop after N failures |
| `maxRetries` | `number` | `1` | Smart retry attempts per scenario |
| `tags` | `string` | `""` (run all) | Tag filter expression |
| `notes` | `string` | See contract | Runtime notes applied to every MixedCase |

---

## Entity: AssetType (Reference)

Derived from `src/hosts.json`. Six installable asset types:

| ID | Install Target (Cursor) | Install Target (Claude Desktop) |
|----|------------------------|--------------------------------|
| `mcp` | `.cursor/mcp.json` (JSON merge) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| `skill` | `.cursor/skills/<name>/` | Not supported |
| `prompt` | `AGENTS.md` (append with marker) | Not supported |
| `command` | `.cursor/commands/<name>.md` | Not supported |
| `subAgent` | `.cursor/agents/<name>.md` | Not supported |
| `pack` | Dispatches to per-asset handlers | Only MCP assets dispatched |

---

## State Transitions: Install Result

Each CLI invocation returns one of four statuses:

```
[initial] → written   (new install, file created/updated)
[initial] → exists    (exact same content already present; idempotent no-op)
[initial] → conflict  (key already exists with different content)
[initial] → error     (unrecoverable: missing source, invalid format, etc.)
```

These states drive the idempotency Scenarios at the end of each core feature file.

---

## Relationships

```
ScenarioRunConfig
    └── configures → exec-scenarios execution

FeatureFile (1)
    ├── contains → Scenario (1..N)
    │                └── contains → Step (3..10)
    └── located in → tests/features/core/ | tests/features/host/

Scenario
    └── Given steps → copy → Fixture → TempWorkingDirectory
    └── When steps → invoke → CLI binary (node bin/agent-get.js)
    └── Then steps → assert → TempWorkingDirectory (file-system state)

TempWorkingDirectory
    └── lifecycle managed by → bash-shell Setup/Teardown (mktemp / rm -rf)
```
