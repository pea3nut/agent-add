# Scenario Run Config

## testDir

tests

## executor

command: bash-shell

config:
The CLI binary is pre-built at `bin/agent-add.js` relative to the project root.
Every feature file sets `PROJECT_ROOT=$(git rev-parse --show-toplevel)` in a `Background` block.
Run each CLI step with: `node "$PROJECT_ROOT/bin/agent-add.js"`

The binary must be built before running scenarios (`npm run build`).

For Claude Desktop scenarios, set the `AGENT_ADD_HOME` environment variable to the
temp working directory to redirect `os.homedir()` expansions away from the real user home.
Example: `AGENT_ADD_HOME="$SETUP_TMPDIR" node "$PROJECT_ROOT/bin/agent-add.js" --host claude-desktop ...`

No network access is required for `@P0` and `@P1` scenarios. `@network`-tagged scenarios
require internet access and should be excluded from the default run.

## tags

not @skip

## concurrency

8

## maxFailures

2

## maxRetries

0

## 运行时注记

notes:
- Before running any scenario, ensure the CLI binary exists at `bin/agent-add.js`.
  If it does not exist, run `npm run build` first.
- Every feature file uses a `Background` block to set `PROJECT_ROOT=$(git rev-parse --show-toplevel)`.
  This variable is available in all subsequent steps and replaces hardcoded absolute paths.
- The `Given` steps create a unique temp working directory via `mktemp -d`. All subsequent
  file operations happen inside this directory.
- Cursor and Claude Code detection relies on `.cursor/` or `.claude/` directories being
  present in the temp working directory. The `Given` step must create these before CLI invocation.
- For Claude Desktop scenarios, pass `AGENT_ADD_HOME` to the CLI command so that config paths
  expand relative to the temp dir. On Windows, use `cygpath -w "$SETUP_TMPDIR"` to get the
  Windows-native path, then set `AGENT_ADD_HOME` to that value — both `~/` and `%APPDATA%`
  prefix paths are redirected via `AGENT_ADD_HOME`. Example:
    WIN_TMPDIR=$(cygpath -w "$SETUP_TMPDIR" 2>/dev/null || echo "$SETUP_TMPDIR") && AGENT_ADD_HOME="$WIN_TMPDIR" node ...
  Assert config existence cross-platform:
    test -f "$SETUP_TMPDIR/Library/Application Support/Claude/claude_desktop_config.json" || test -f "$SETUP_TMPDIR/AppData/Roaming/Claude/claude_desktop_config.json"
- Assertions use standard POSIX tools: `test -f`, `cat`, `grep`. Do NOT use `jq` as it
  may not be available in the execution environment; use `grep -q '"key"'` for JSON key checks.
- After all scenarios complete, update `tests/test-results/badge.json` based on the
  run result summary. The file follows the shields.io endpoint schema:
  `{"schemaVersion":1,"label":"scenario tests","message":"<passed>/<total> passing","color":"<color>"}`
  Color rules: all passed → "brightgreen", >80% passed → "orange", ≤80% → "red".
  If any scenarios failed, append " (<failed> failed)" to the message.
- CLI syntax: the binary uses flags directly (no `install` subcommand).
  Examples: `--mcp ./file.json`, `--skill ./dir`, `--prompt ./file.md`, `--command ./file.md`,
  `--sub-agent ./file.md`, `--pack ./manifest.json`, `--host cursor`
- Pack manifest source paths are resolved relative to CWD (not the manifest file's directory).
  When running pack tests, source paths in manifest.json must be relative to the CWD
  set at CLI invocation time (i.e., `$SETUP_TMPDIR`).
- The feature step `Then the output matches the pattern \d+\.\d+\.\d+` means the output
  CONTAINS the pattern as a substring, not a full-string match. Evaluate with:
    node "..." --version | grep -E '\d+\.\d+\.\d+'
  Pre-release suffixes like `-beta.1` are valid and must NOT cause the assertion to fail.
- On Windows (Git-bash / MSYS2), prefix CLI invocations that pass inline JSON arguments
  (i.e., `--mcp '{"...":...}'` or any flag whose value starts with `{`) with
  `MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'` to prevent MSYS from converting forward
  slashes inside the JSON string before Node.js receives it. Example:
    MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' node "$PROJECT_ROOT/bin/agent-add.js" \
      --host cursor --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp@latest"]}}'
