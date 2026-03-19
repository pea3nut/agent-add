# Research: Scenario Tests 测试体系

**Feature**: `003-scenario-tests`  
**Date**: 2026-03-17

---

## Decision 1: Executor Type for `scenario-run-config.md`

**Decision**: `bash-shell` (custom CLI executor)

**Rationale**:  
The `/tns:exec-scenarios` command supports three built-in executor types: `playwright-cli`, `bash-curl`, and custom CLI. Since the CLI under test (`agent-get`) runs as a Node.js CLI binary and assertions are file-system checks, `bash-shell` is the appropriate choice. Each Gherkin step maps to a bash command or a `node bin/agent-get.js` invocation.

The exec-scenarios.md specifies setup/teardown for custom CLI executors:
- **Setup**: `bash: mktemp -d /tmp/scenario-${caseId}-XXXXXX` → capture as `SETUP_TMPDIR`
- **Teardown**: `bash: rm -rf "$SETUP_TMPDIR"` (precise, only removes this scenario's temp dir)

**Alternatives Considered**:
- `playwright-cli`: Overkill; designed for browser automation, not CLI testing
- `bash-curl`: Designed for REST API testing; CLI binary output is not HTTP responses

---

## Decision 2: `AGENT_GET_HOME` Implementation Scope

**Decision**: Add a `getHomedir()` helper in `src/assets/mcp.ts` only; `detect-hosts.ts` is not changed.

**Rationale**:  
The only path that reads from `os.homedir()` for *write* operations (config file installation) is `resolveConfigFilePath` in `src/assets/mcp.ts`. This is where Claude Desktop MCP config paths like `~/Library/Application Support/Claude/` are expanded. For Scenario Tests, we only need to redirect this write to a temp directory.

`src/utils/detect-hosts.ts` also calls `os.homedir()` for host *detection*, but Scenario Tests will always pass `--host <name>` explicitly to the CLI (avoiding auto-detection), so redirecting detection homedir is not needed.

Minimal change in `src/assets/mcp.ts`:
```typescript
function getHomedir(): string {
  return process.env['AGENT_GET_HOME'] ?? os.homedir();
}
```
Replace the single `os.homedir()` call in `resolveConfigFilePath` with `getHomedir()`.

**Alternatives Considered**:
- Monkey-patching `os.homedir` via a test hook: Too invasive, would require test infrastructure code
- Modifying all callers of `os.homedir` project-wide: Unnecessary scope creep
- Using a separate config override flag: More complex than a simple env var

---

## Decision 3: Gherkin Language for Committed Files

**Decision**: All `.feature` files and `scenario-run-config.md` written entirely in **English**.

**Rationale**:  
User directive: "对于要提交到仓库的文件，比如 Gherkin 和 运行配置，多要用英文" (files committed to the repository — Gherkin and run config — must use English). English Gherkin is the Cucumber/Gherkin standard and ensures compatibility with all tooling.

Scenario titles and step text will use English. Tags (`@P0`, `@P1`, `@P2`, `@network`, `@skip`) remain as-is (they are tag identifiers, not prose).

**Alternatives Considered**:
- Chinese Gherkin: Technically valid, but non-standard and violates user directive
- Mixed language: Creates inconsistency and maintenance burden

---

## Decision 4: Fixture File Design

**Decision**: Minimal, self-contained fixture files; one fixture per asset type concept.

**Rationale**:  
Fixtures must represent real-world valid inputs to the CLI. The spec (FR-009) requires:
- Valid MCP JSON: A real MCP server config with `command` + `args`
- Valid Skill directory: A directory containing `SKILL.md`  
- Invalid Skill directory: A directory **without** `SKILL.md` (to test error handling)
- Prompt `.md`: Simple markdown text
- Command `.md`: Simple markdown text
- Sub-agent `.md`: Markdown with `agent-get/*` frontmatter fields (for pack/sub-agent install)
- Pack manifest JSON: References all 6 asset types in a single manifest

Fixtures are static — they are copied to temp dirs before each test scenario and must not be modified during test execution (FR-010).

**Fixture Names**: All English, kebab-case.

**Alternatives Considered**:
- Generating fixtures programmatically: Adds unnecessary complexity; static files are cleaner
- Sharing fixtures between scenarios: Increases coupling; independent fixture sets are safer

---

## Decision 5: Host Test Scenarios Scope

**Decision**: `cursor.feature` and `claude-code.feature` cover all supported asset types (mcp, skill, prompt, command, subAgent); `claude-desktop.feature` covers MCP only (the only supported asset type).

**Rationale**:  
From `src/hosts.json`: Claude Desktop only has `mcp.supported: true`; all other asset types have `supported: false`. The host feature files should mirror the actual capability matrix. All host scenarios are tagged `@P1` for Cursor/Claude Code and `@P2` for Claude Desktop (per FR-003a).

Per spec (FR-003): Host scenarios are "basic install only" — no edge cases or idempotency scenarios (those belong in `core/`).

**Alternatives Considered**:
- Testing unsupported asset types on Claude Desktop (should fail with error): Out of scope for this iteration; belongs in a future error-handling spec
- Combining cursor + claude-code into one file: Violates FR-003 (one file per host)

---

## Decision 6: Pack Manifest Format

**Decision**: Pack manifest (`tests/fixtures/pack/manifest.json`) references local relative paths for all 6 asset type sources.

**Rationale**:  
The spec requires the fixture to be a "完整 Pack Manifest JSON" (complete pack manifest). Since we can't rely on a real remote Git repo or network in `@P0`/`@P1` scenarios (network tests are tagged `@network`), the pack manifest will use local relative paths. The scenario's Given step will copy fixture files to the temp dir at the expected relative paths before invoking the CLI.

**Alternatives Considered**:
- Git-based manifest: Requires network; must be `@network`-tagged and excluded from core
- Using placeholder URLs: Would cause failures without mocking

---

## Resolved Unknowns Summary

| Unknown | Decision |
|---------|----------|
| Executor type for bash-shell testing | `bash-shell` custom CLI executor |
| AGENT_GET_HOME scope | `src/assets/mcp.ts` only (one helper function) |
| Language for committed files | English throughout |
| Fixture design | Static, minimal, one per concept |
| Host test scope | Match actual capability matrix from hosts.json |
| Pack manifest format | Local relative paths (no network required) |
