Feature: MCP installation on Cursor

  @P0
  Scenario: Install MCP on Cursor succeeds
    Given a temp working directory is created
    And the MCP fixture is copied: cp /e/_pea3nut/projects/agent-get/tests/fixtures/mcp/playwright.json "$SETUP_TMPDIR/playwright.json"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor ./playwright.json
    Then the exit code is 0

  @P0
  Scenario: MCP install writes to the correct file with correct content
    Given a temp working directory is created
    And the MCP fixture is copied: cp /e/_pea3nut/projects/agent-get/tests/fixtures/mcp/playwright.json "$SETUP_TMPDIR/playwright.json"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor ./playwright.json
    Then the config file exists: test -f "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP key exists: jq -e '.mcpServers.playwright' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the command value is correct: jq -e '.mcpServers.playwright.command == "npx"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P1
  Scenario: Repeated install of same content returns exists
    Given a temp working directory is created
    And the MCP fixture is copied: cp /e/_pea3nut/projects/agent-get/tests/fixtures/mcp/playwright.json "$SETUP_TMPDIR/playwright.json"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And the MCP is already installed: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor ./playwright.json
    When the user runs again: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor ./playwright.json
    Then the output contains "exists"

  @P1
  Scenario: Install with conflicting key returns conflict
    Given a temp working directory is created
    And the MCP fixture is copied: cp /e/_pea3nut/projects/agent-get/tests/fixtures/mcp/playwright.json "$SETUP_TMPDIR/playwright.json"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And a conflicting mcp.json exists: printf '{"mcpServers":{"playwright":{"command":"different"}}}' > "$SETUP_TMPDIR/.cursor/mcp.json"
    When the user runs: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor ./playwright.json
    Then the output contains "conflict"

  @P1
  Scenario: Install from non-existent path returns error
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor ./nonexistent.json
    Then the exit code is non-zero
