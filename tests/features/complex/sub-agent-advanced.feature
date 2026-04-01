Feature: Sub-agent frontmatter processing and conflict detection

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: Sub-agent on Cursor expands cursor-specific frontmatter fields
    Given a temp working directory is created
    And the sub-agent fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/sub-agent/my-agent.md" "$SETUP_TMPDIR/my-agent.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --sub-agent ./my-agent.md
    Then the exit code is 0
    And the cursor name field is expanded: grep -q 'cursor-agent' "$SETUP_TMPDIR/.cursor/agents/my-agent.md"
    And no agent-get prefixed fields remain: ! grep -q 'agent-add/' "$SETUP_TMPDIR/.cursor/agents/my-agent.md"
    And the description field is preserved: grep -q 'test sub-agent' "$SETUP_TMPDIR/.cursor/agents/my-agent.md"

  @P0
  Scenario: Sub-agent on Claude Code expands claude-code-specific frontmatter fields
    Given a temp working directory is created
    And the sub-agent fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/sub-agent/my-agent.md" "$SETUP_TMPDIR/my-agent.md"
    And a .claude directory exists: mkdir -p "$SETUP_TMPDIR/.claude"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --sub-agent ./my-agent.md
    Then the exit code is 0
    And the claude-code name field is expanded: grep -q 'claude-agent' "$SETUP_TMPDIR/.claude/agents/my-agent.md"
    And no agent-get prefixed fields remain: ! grep -q 'agent-add/' "$SETUP_TMPDIR/.claude/agents/my-agent.md"
    And the description field is preserved: grep -q 'test sub-agent' "$SETUP_TMPDIR/.claude/agents/my-agent.md"

  @P1
  Scenario: Sub-agent conflict detection when existing file has different content
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And a different sub-agent already exists: mkdir -p "$SETUP_TMPDIR/.cursor/agents" && printf '---\ndescription: A different agent\n---\n\nDifferent content here.\n' > "$SETUP_TMPDIR/.cursor/agents/my-agent.md"
    And the sub-agent fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/sub-agent/my-agent.md" "$SETUP_TMPDIR/my-agent.md"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --sub-agent ./my-agent.md > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the exit code is non-zero: test "$(cat "$SETUP_TMPDIR/exitcode.txt")" -ne 0
    And the output contains conflict: grep -qi "conflict" "$SETUP_TMPDIR/out.txt"
