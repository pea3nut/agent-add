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
  Scenario: Repeated install of same content returns overwritten
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And the MCP is already installed: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright.json
    When the user runs again: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright.json
    Then the output contains "overwritten"

  @P1
  Scenario: Installing a changed same-name MCP overwrites its entry
    Given an isolated project and HOME with .cursor/mcp.json containing playwright command old and an unrelated server
    When the playwright MCP fixture is installed on cursor
    Then the CLI exits 0 and reports overwritten
    And decoded playwright exactly matches the source fixture and the unrelated server is unchanged

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
  Scenario: Repeated inline MCP install returns overwritten
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And the MCP is already installed: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp@latest"]}}'
    When the user runs again: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp@latest"]}}' > "$SETUP_TMPDIR/out.txt" 2>&1
    Then the output contains "overwritten": grep -qi "overwritten" "$SETUP_TMPDIR/out.txt"
