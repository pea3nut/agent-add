Feature: Sub-agent installation on Cursor

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: Install sub-agent on Cursor succeeds
    Given a temp working directory is created
    And the sub-agent fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/sub-agent/my-agent.md" "$SETUP_TMPDIR/my-agent.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --sub-agent ./my-agent.md
    Then the exit code is 0

  @P0
  Scenario: Sub-agent install writes to the correct path
    Given a temp working directory is created
    And the sub-agent fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/sub-agent/my-agent.md" "$SETUP_TMPDIR/my-agent.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --sub-agent ./my-agent.md
    Then the sub-agent file exists: test -f "$SETUP_TMPDIR/.cursor/agents/my-agent.md"

  @P0
  Scenario: Sub-agent install strips agent-add frontmatter fields
    Given a temp working directory is created
    And the sub-agent fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/sub-agent/my-agent.md" "$SETUP_TMPDIR/my-agent.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --sub-agent ./my-agent.md
    Then the cursor name field is stripped: ! grep -q 'agent-add/cursor/name' "$SETUP_TMPDIR/.cursor/agents/my-agent.md"
    And the claude-code name field is stripped: ! grep -q 'agent-add/claude-code/name' "$SETUP_TMPDIR/.cursor/agents/my-agent.md"

  @P1
  Scenario: Repeated sub-agent install returns exists
    Given a temp working directory is created
    And the sub-agent fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/sub-agent/my-agent.md" "$SETUP_TMPDIR/my-agent.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And the sub-agent is already installed: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --sub-agent ./my-agent.md
    When the user installs again: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --sub-agent ./my-agent.md
    Then the output contains "exists"
