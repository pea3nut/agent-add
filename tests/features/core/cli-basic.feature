Feature: CLI basic commands

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: --version outputs the correct version number
    Given a temp working directory is created
    When the user runs node "$PROJECT_ROOT/bin/agent-add.js" --version
    Then the output matches the pattern \d+\.\d+\.\d+

  @P0
  Scenario: --help outputs help information
    Given a temp working directory is created
    When the user runs node "$PROJECT_ROOT/bin/agent-add.js" --help
    Then the output contains "Usage:"

  @P0
  Scenario: No --host flag in non-TTY exits with error code 2
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    When the user runs without --host: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --mcp ./playwright.json > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the exit code is 2: grep -q "^2$" "$SETUP_TMPDIR/exitcode.txt"
    And the output mentions non-interactive: grep -qi "non-interactive" "$SETUP_TMPDIR/out.txt"
