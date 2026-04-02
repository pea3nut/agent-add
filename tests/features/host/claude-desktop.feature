Feature: Claude Desktop host basic installation

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P2
  Scenario: Install MCP on Claude Desktop host
    Given a temp working directory is created
    When the user runs: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json" && cd "$SETUP_TMPDIR" && WIN_TMPDIR=$(cygpath -w "$SETUP_TMPDIR" 2>/dev/null || echo "$SETUP_TMPDIR") && AGENT_ADD_HOME="$WIN_TMPDIR" node "$PROJECT_ROOT/bin/agent-add.js" --host claude-desktop --mcp ./playwright.json
    Then the config file exists: test -f "$SETUP_TMPDIR/Library/Application Support/Claude/claude_desktop_config.json" || test -f "$SETUP_TMPDIR/AppData/Roaming/Claude/claude_desktop_config.json"
    And the MCP key exists: grep -rq '"playwright"' "$SETUP_TMPDIR/Library" 2>/dev/null || grep -rq '"playwright"' "$SETUP_TMPDIR/AppData" 2>/dev/null
