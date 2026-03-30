Feature: Claude Desktop host basic installation

  @P2
  Scenario: Install MCP on Claude Desktop host (macOS)
    Given a temp working directory is created
    When the user runs: AGENT_GET_HOME="$SETUP_TMPDIR" cd "$SETUP_TMPDIR" && cp /e/_pea3nut/projects/agent-get/tests/fixtures/mcp/playwright.json "$SETUP_TMPDIR/playwright.json" && AGENT_GET_HOME="$SETUP_TMPDIR" node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host claude-desktop ./playwright.json
    Then the config file exists: test -f "$SETUP_TMPDIR/Library/Application Support/Claude/claude_desktop_config.json"
    And the MCP key exists: jq -e '.mcpServers.playwright' "$SETUP_TMPDIR/Library/Application Support/Claude/claude_desktop_config.json"
