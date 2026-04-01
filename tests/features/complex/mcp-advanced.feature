Feature: MCP advanced installation scenarios

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: MCP with env variables preserves env in JSON output
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright-with-env.json" "$SETUP_TMPDIR/playwright-with-env.json"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright-with-env.json
    Then the exit code is 0
    And the env BROWSER key exists: grep -q '"BROWSER"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the env BROWSER value is correct: grep -q '"chromium"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the env HEADLESS key exists: grep -q '"HEADLESS"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the env HEADLESS value is correct: grep -q '"true"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P0
  Scenario: MCP install into pre-existing config preserves existing entries
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And a pre-existing mcp.json exists: printf '{"mcpServers":{"existing-tool":{"command":"echo","args":["hello"]}}}' > "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright.json
    Then the exit code is 0
    And the existing entry is preserved: grep -q '"existing-tool"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the existing command is preserved: grep -q '"echo"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the new MCP is added: grep -q '"playwright"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P1
  Scenario: Two sequential MCP installs coexist in same config on Claude Code
    Given a temp working directory is created
    And MCP fixtures are copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json" && cp "$PROJECT_ROOT/tests/fixtures/mcp/filesystem.json" "$SETUP_TMPDIR/filesystem.json"
    And a .claude directory exists: mkdir -p "$SETUP_TMPDIR/.claude"
    And first MCP is installed: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --mcp ./playwright.json
    When the user installs second MCP: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --mcp ./filesystem.json
    Then the exit code is 0
    And both MCPs coexist: grep -q '"playwright"' "$SETUP_TMPDIR/.mcp.json" && grep -q '"filesystem"' "$SETUP_TMPDIR/.mcp.json"

  @P1
  Scenario: Codex MCP install produces TOML table format
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    And the codex config directory exists: mkdir -p "$SETUP_TMPDIR/.codex"
    When the user runs: cd "$SETUP_TMPDIR" && AGENT_ADD_HOME="$SETUP_TMPDIR" node "$PROJECT_ROOT/bin/agent-add.js" --host codex --mcp ./playwright.json
    Then the exit code is 0
    And the TOML config exists: test -f "$SETUP_TMPDIR/.codex/config.toml"
    And the TOML contains mcp_servers section: grep -q 'mcp_servers' "$SETUP_TMPDIR/.codex/config.toml"
    And the TOML contains playwright: grep -q 'playwright' "$SETUP_TMPDIR/.codex/config.toml"
    And the TOML contains command value: grep -q 'npx' "$SETUP_TMPDIR/.codex/config.toml"

  @P1
  Scenario: Codex TOML preserves env variables
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright-with-env.json" "$SETUP_TMPDIR/playwright-with-env.json"
    And the codex config directory exists: mkdir -p "$SETUP_TMPDIR/.codex"
    When the user runs: cd "$SETUP_TMPDIR" && AGENT_ADD_HOME="$SETUP_TMPDIR" node "$PROJECT_ROOT/bin/agent-add.js" --host codex --mcp ./playwright-with-env.json
    Then the exit code is 0
    And the TOML config exists: test -f "$SETUP_TMPDIR/.codex/config.toml"
    And the TOML contains BROWSER env: grep -q 'BROWSER' "$SETUP_TMPDIR/.codex/config.toml"
    And the TOML contains chromium value: grep -q 'chromium' "$SETUP_TMPDIR/.codex/config.toml"

  @P2
  Scenario: Vibe MCP install produces TOML array format
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    And a .vibe directory exists: mkdir -p "$SETUP_TMPDIR/.vibe"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host vibe --mcp ./playwright.json
    Then the exit code is 0
    And the TOML config exists: test -f "$SETUP_TMPDIR/.vibe/config.toml"
    And the TOML uses array format: grep -q 'mcp_servers' "$SETUP_TMPDIR/.vibe/config.toml"
    And the TOML contains name field: grep -q 'playwright' "$SETUP_TMPDIR/.vibe/config.toml"
    And the TOML contains transport field: grep -q 'stdio' "$SETUP_TMPDIR/.vibe/config.toml"
