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

2

## maxRetries

0

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
