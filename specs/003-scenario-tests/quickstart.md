# Quickstart: Running Scenario Tests

**Feature**: `003-scenario-tests`

---

## Prerequisites

1. **Build the CLI** — Scenario tests run against the compiled binary:
   ```bash
   npm run build
   ```
   Verify that `bin/agent-get.js` and `dist/index.js` exist after the build.

2. **Install `jq`** — Assertions use `jq` for JSON field checking:
   ```bash
   # macOS
   brew install jq
   # Ubuntu/Debian
   apt-get install jq
   ```

3. **Ensure the test files exist** — After implementation, verify:
   ```bash
   ls tests/features/core/
   # cli-basic.feature  mcp.feature  skill.feature  prompt.feature
   # command.feature  sub-agent.feature  pack.feature

   ls tests/features/host/
   # cursor.feature  claude-code.feature  claude-desktop.feature

   ls tests/fixtures/
   # mcp/  skill/  prompt/  command/  sub-agent/  pack/
   ```

---

## Running Scenario Tests

Scenario tests are **not** run via `npm test`. They are triggered manually through the Cursor AI command `/tns:exec-scenarios`, which uses the `scenario-case-runner` sub-agent.

### Run All Scenarios (excluding network tests)

In Cursor, type:
```
/tns:exec-scenarios
```

This reads `tests/features/scenario-run-config.md` and runs all scenarios matching `not @network and not @skip`.

### Run Only `@P0` (Critical Happy Path)

```
/tns:exec-scenarios cases=tests/features/core
```
Then filter by P0 tag in `scenario-run-config.md` by temporarily changing the `tags` field to `@P0`.

Or run with an inline override:
```
/tns:exec-scenarios cases=tests/features/core
```

### Run a Specific Feature File

```
/tns:exec-scenarios cases=tests/features/core/mcp.feature
```

### Run All Core Tests

```
/tns:exec-scenarios cases=tests/features/core
```

### Run All Host Tests

```
/tns:exec-scenarios cases=tests/features/host
```

### Run a Specific Scenario by Title

```
/tns:exec-scenarios cases="Install MCP on Cursor succeeds"
```

---

## Test Results

After execution, results are written to:

```
tests/test-results/
└── run-<YYYYMMDD>-<HHmmss>/
    ├── result.json    ← Machine-readable: per-scenario pass/fail with timings
    ├── summary.md     ← Human-readable: table of results + failed case details
    └── index.json     ← Run metadata and artifact paths
```

---

## Isolation Guarantee

Each scenario runs in a fresh temporary directory (`mktemp -d`). The temp directory is removed after each scenario (success or failure). This means:

- **Running the same scenario twice is safe** — no leftover files interfere
- **Your real `~/.cursor/`, `~/.claude/`, `~/Library/Application Support/Claude/` directories are never touched**
- Claude Desktop scenarios use `AGENT_GET_HOME=$SETUP_TMPDIR` to redirect `~/` path expansion

---

## Existing Tests Still Work

Scenario tests do not replace the existing vitest suite:

```bash
# Unit + integration tests (unchanged)
npm test

# Contract tests (unchanged)
npm run test:contract
```

---

## Adding New Scenarios

1. Open the relevant `.feature` file in `tests/features/core/` or `tests/features/host/`
2. Add a new `Scenario:` block following the [Gherkin conventions](https://cucumber.io/docs/gherkin/)
3. Tag with `@P0`, `@P1`, or `@P2` as appropriate (see `spec.md` FR-003a for rules)
4. If a new fixture is needed, add it to `tests/fixtures/<asset-type>/`
5. Run the scenario with `/tns:exec-scenarios cases="<Your Scenario Title>"`

---

## Source Code Change: `AGENT_GET_HOME`

The only production code change in this feature is a 3-line guard in `src/assets/mcp.ts`:

```typescript
function getHomedir(): string {
  return process.env['AGENT_GET_HOME'] ?? os.homedir();
}
```

This allows Claude Desktop MCP install paths (e.g., `~/Library/Application Support/Claude/`) to be redirected to a temp directory during testing without affecting real user data.

To verify the change works:
```bash
AGENT_GET_HOME=/tmp/test-home node bin/agent-get.js install --host claude-desktop ./playwright.json
# Should write to /tmp/test-home/Library/Application Support/Claude/claude_desktop_config.json
```
