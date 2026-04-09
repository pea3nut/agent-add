Feature: Batch directory installation with /* glob

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: Batch install commands from local directory with /*
    Given a temp working directory is created
    And batch command fixtures are copied: cp -r "$PROJECT_ROOT/tests/fixtures/command/batch" "$SETUP_TMPDIR/my-commands"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --command "./my-commands/*"
    Then the exit code is 0
    And command A is installed: test -f "$SETUP_TMPDIR/.cursor/commands/cmd-a.md"
    And command B is installed: test -f "$SETUP_TMPDIR/.cursor/commands/cmd-b.md"
    And command C is installed: test -f "$SETUP_TMPDIR/.cursor/commands/cmd-c.md"

  @P0
  Scenario: Batch install MCP configs from local directory with /*
    Given a temp working directory is created
    And batch MCP fixtures are copied: cp -r "$PROJECT_ROOT/tests/fixtures/mcp/batch" "$SETUP_TMPDIR/my-mcps"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp "./my-mcps/*"
    Then the exit code is 0
    And MCP svc-a is installed: grep -q '"svc-a"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And MCP svc-b is installed: grep -q '"svc-b"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P1
  Scenario: Batch install with /* on empty directory fails
    Given a temp working directory is created
    And an empty directory is created: mkdir -p "$SETUP_TMPDIR/empty-dir"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --command "./empty-dir/*" > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the exit code is 2: grep -q "^2$" "$SETUP_TMPDIR/exitcode.txt"

  @P1
  Scenario: Single file without /* still works normally
    Given a temp working directory is created
    And the command fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/command/my-command.md" "$SETUP_TMPDIR/my-command.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --command ./my-command.md
    Then the exit code is 0
    And the command is installed: test -f "$SETUP_TMPDIR/.cursor/commands/my-command.md"
