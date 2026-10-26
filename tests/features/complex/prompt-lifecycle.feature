Feature: Prompt lifecycle and write strategies

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: Prompt update with explicit overwrite returns updated status
    Given a temp working directory is created
    And the prompt fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/prompt/my-prompt.md" "$SETUP_TMPDIR/my-prompt.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And the prompt is installed first time: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt ./my-prompt.md
    And the source is replaced with v2: cp "$PROJECT_ROOT/tests/fixtures/prompt/my-prompt-v2.md" "$SETUP_TMPDIR/my-prompt.md"
    When the user reinstalls the prompt: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt ./my-prompt.md --overwrite > "$SETUP_TMPDIR/out.txt" 2>&1
    Then the output contains updated: grep -qi "updated" "$SETUP_TMPDIR/out.txt"
    And the new content is present: grep -q "professionally" "$SETUP_TMPDIR/AGENTS.md"

  @P0
  Scenario: Changed prompt requires overwrite and preserves the original target
    Given a temp working directory is created
    And the prompt fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/prompt/my-prompt.md" "$SETUP_TMPDIR/my-prompt.md"
    And the prompt is installed: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt ./my-prompt.md
    And the installed file is saved: cp "$SETUP_TMPDIR/AGENTS.md" "$SETUP_TMPDIR/original.md"
    And the source is replaced with v2: cp "$PROJECT_ROOT/tests/fixtures/prompt/my-prompt-v2.md" "$SETUP_TMPDIR/my-prompt.md"
    When the user reinstalls without overwrite: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt ./my-prompt.md > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exit.txt"
    Then the exit code is 1: grep -q '^1$' "$SETUP_TMPDIR/exit.txt"
    And the original target is unchanged: cmp -s "$SETUP_TMPDIR/original.md" "$SETUP_TMPDIR/AGENTS.md"
    And the output suggests overwrite: grep -q -- '--overwrite' "$SETUP_TMPDIR/out.txt"

  @P1
  Scenario: Two different prompts coexist in AGENTS.md with separate markers
    Given a temp working directory is created
    And prompt fixtures are copied: cp "$PROJECT_ROOT/tests/fixtures/prompt/my-prompt.md" "$SETUP_TMPDIR/my-prompt.md" && cp "$PROJECT_ROOT/tests/fixtures/prompt/second-prompt.md" "$SETUP_TMPDIR/second-prompt.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And first prompt is installed: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt ./my-prompt.md
    When the user installs second prompt: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt ./second-prompt.md
    Then the exit code is 0
    And the first marker exists: grep -q 'agent-add:my-prompt' "$SETUP_TMPDIR/AGENTS.md"
    And the second marker exists: grep -q 'agent-add:second-prompt' "$SETUP_TMPDIR/AGENTS.md"
    And both contents are present: grep -q 'bullet points' "$SETUP_TMPDIR/AGENTS.md" && grep -q 'security issues' "$SETUP_TMPDIR/AGENTS.md"

  @P1
  Scenario: Prompt append preserves pre-existing non-agent-get content
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And a pre-existing AGENTS.md exists: printf '# My Project Notes\nSome existing content\n' > "$SETUP_TMPDIR/AGENTS.md"
    And the prompt fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/prompt/my-prompt.md" "$SETUP_TMPDIR/my-prompt.md"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt ./my-prompt.md
    Then the exit code is 0
    And the original content is preserved: grep -q 'My Project Notes' "$SETUP_TMPDIR/AGENTS.md"
    And the prompt marker is appended: grep -q 'agent-add:my-prompt' "$SETUP_TMPDIR/AGENTS.md"

  @P1
  Scenario: Prompt create-file-in-dir strategy on Roo Code
    Given a temp working directory is created
    And a .roo directory exists: mkdir -p "$SETUP_TMPDIR/.roo"
    And the prompt fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/prompt/my-prompt.md" "$SETUP_TMPDIR/my-prompt.md"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host roo-code --prompt ./my-prompt.md
    Then the exit code is 0
    And the prompt file is created in rules dir: test -f "$SETUP_TMPDIR/.roo/rules/my-prompt.md"
    And the file content is correct: grep -q 'bullet points' "$SETUP_TMPDIR/.roo/rules/my-prompt.md"
