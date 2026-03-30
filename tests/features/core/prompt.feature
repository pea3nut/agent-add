Feature: Prompt installation on Cursor

  @P0
  Scenario: Install prompt on Cursor appends to AGENTS.md
    Given a temp working directory is created
    And the prompt fixture is copied: cp /e/_pea3nut/projects/agent-get/tests/fixtures/prompt/my-prompt.md "$SETUP_TMPDIR/my-prompt.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor --prompt ./my-prompt.md
    Then the exit code is 0

  @P0
  Scenario: Prompt install content includes agent-get markers
    Given a temp working directory is created
    And the prompt fixture is copied: cp /e/_pea3nut/projects/agent-get/tests/fixtures/prompt/my-prompt.md "$SETUP_TMPDIR/my-prompt.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor --prompt ./my-prompt.md
    Then the AGENTS.md file exists: test -f "$SETUP_TMPDIR/AGENTS.md"
    And the opening marker exists: grep -q '<!-- agent-get:my-prompt -->' "$SETUP_TMPDIR/AGENTS.md"
    And the closing marker exists: grep -q '<!-- /agent-get:my-prompt -->' "$SETUP_TMPDIR/AGENTS.md"

  @P1
  Scenario: Repeated prompt install with same content returns exists
    Given a temp working directory is created
    And the prompt fixture is copied: cp /e/_pea3nut/projects/agent-get/tests/fixtures/prompt/my-prompt.md "$SETUP_TMPDIR/my-prompt.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And the prompt is already installed: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor --prompt ./my-prompt.md
    When the user installs again: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor --prompt ./my-prompt.md
    Then the output contains "exists"
