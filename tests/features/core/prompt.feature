Feature: Prompt installation on Cursor

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: Install prompt on Cursor appends to AGENTS.md
    Given a temp working directory is created
    And the prompt fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/prompt/my-prompt.md" "$SETUP_TMPDIR/my-prompt.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt ./my-prompt.md
    Then the exit code is 0

  @P0
  Scenario: Prompt install content includes agent-add markers
    Given a temp working directory is created
    And the prompt fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/prompt/my-prompt.md" "$SETUP_TMPDIR/my-prompt.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt ./my-prompt.md
    Then the AGENTS.md file exists: test -f "$SETUP_TMPDIR/AGENTS.md"
    And the opening marker exists: grep -q '<!-- agent-add:my-prompt -->' "$SETUP_TMPDIR/AGENTS.md"
    And the closing marker exists: grep -q '<!-- /agent-add:my-prompt -->' "$SETUP_TMPDIR/AGENTS.md"

  @P1
  Scenario: Repeated prompt install with same content returns exists
    Given a temp working directory is created
    And the prompt fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/prompt/my-prompt.md" "$SETUP_TMPDIR/my-prompt.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And the prompt is already installed: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt ./my-prompt.md
    When the user installs again: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt ./my-prompt.md
    Then the output contains "exists"

  @P0
  Scenario: Install prompt from inline Markdown source
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt $'# My Inline Prompt\n\nYou are a helpful assistant.'
    Then the exit code is 0
    And the AGENTS.md file exists: test -f "$SETUP_TMPDIR/AGENTS.md"
    And the opening marker exists: grep -q '<!-- agent-add:my-inline-prompt -->' "$SETUP_TMPDIR/AGENTS.md"

  @P1
  Scenario: Repeated inline prompt install returns exists
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And the prompt is already installed: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt $'# My Inline Prompt\n\nYou are a helpful assistant.'
    When the user installs again: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt $'# My Inline Prompt\n\nYou are a helpful assistant.' > "$SETUP_TMPDIR/out.txt" 2>&1
    Then the output contains "exists": grep -qi "exists" "$SETUP_TMPDIR/out.txt"
