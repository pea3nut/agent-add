Feature: Claude Desktop host basic installation

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P2
  Scenario: Install MCP on Claude Desktop host (macOS)
    Given a temp working directory is created
    When the user runs: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json" && cd "$SETUP_TMPDIR" && AGENT_ADD_HOME="$SETUP_TMPDIR" node "$PROJECT_ROOT/bin/agent-add.js" --host claude-desktop --mcp ./playwright.json
    Then the config file exists: test -f "$SETUP_TMPDIR/Library/Application Support/Claude/claude_desktop_config.json"
    And the MCP key exists: grep -q '"playwright"' "$SETUP_TMPDIR/Library/Application Support/Claude/claude_desktop_config.json"
