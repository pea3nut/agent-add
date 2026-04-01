Feature: CLI error handling for unsupported asset types

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P1
  Scenario: Explicit unsupported asset type exits with code 2
    Given a temp working directory is created
    And the skill fixture is copied: cp -r "$PROJECT_ROOT/tests/fixtures/skill/my-skill" "$SETUP_TMPDIR/my-skill"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-desktop --skill ./my-skill > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the exit code is 2: grep -q "^2$" "$SETUP_TMPDIR/exitcode.txt"
    And the output mentions unsupported: grep -qi "does not support" "$SETUP_TMPDIR/out.txt"
