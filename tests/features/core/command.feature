Feature: Command installation on Cursor

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: Install command on Cursor succeeds
    Given a temp working directory is created
    And the command fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/command/my-command.md" "$SETUP_TMPDIR/my-command.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --command ./my-command.md
    Then the exit code is 0

  @P0
  Scenario: Command install writes to the correct path
    Given a temp working directory is created
    And the command fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/command/my-command.md" "$SETUP_TMPDIR/my-command.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --command ./my-command.md
    Then the command file exists: test -f "$SETUP_TMPDIR/.cursor/commands/my-command.md"
    And the command file has correct content: grep -q 'test command' "$SETUP_TMPDIR/.cursor/commands/my-command.md"

  @P1
  Scenario: Repeated command install returns exists
    Given a temp working directory is created
    And the command fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/command/my-command.md" "$SETUP_TMPDIR/my-command.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And the command is already installed: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --command ./my-command.md
    When the user installs again: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --command ./my-command.md
    Then the output contains "exists"
