Feature: MCP installation on Cursor

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: Install MCP on Cursor succeeds
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright.json
    Then the exit code is 0

  @P0
  Scenario: MCP install writes to the correct file with correct content
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright.json
    Then the config file exists: test -f "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP key exists: grep -q '"playwright"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the command value is correct: grep -q '"command": "npx"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P1
  Scenario: Repeated install of same content returns exists
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And the MCP is already installed: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright.json
    When the user runs again: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright.json
    Then the output contains "exists"

  @P1
  Scenario: Install with conflicting key returns conflict
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And a conflicting mcp.json exists: printf '{"mcpServers":{"playwright":{"command":"different"}}}' > "$SETUP_TMPDIR/.cursor/mcp.json"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright.json > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the output contains "conflict": grep -qi "conflict" "$SETUP_TMPDIR/out.txt"
    And the exit code is non-zero: [ "$(cat "$SETUP_TMPDIR/exitcode.txt")" -ne 0 ]

  @P1
  Scenario: Install from non-existent path returns error
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./nonexistent.json
    Then the exit code is non-zero

  @P0
  Scenario: Install MCP from inline JSON source
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp@latest"]}}'
    Then the exit code is 0
    And the config file exists: test -f "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP key exists: grep -q '"playwright"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the command value is correct: grep -q '"command": "npx"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P1
  Scenario: Repeated inline MCP install returns exists
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And the MCP is already installed: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp@latest"]}}'
    When the user runs again: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp@latest"]}}' > "$SETUP_TMPDIR/out.txt" 2>&1
    Then the output contains "exists": grep -qi "exists" "$SETUP_TMPDIR/out.txt"
