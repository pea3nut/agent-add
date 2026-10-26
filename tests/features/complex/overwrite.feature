Feature: Same-run conflicts and explicit overwrite

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: Duplicate inputs prevent the entire installation
    Given a temp working directory is created
    And two conflicting commands and a unique prompt exist: mkdir -p "$SETUP_TMPDIR/a" "$SETUP_TMPDIR/b" && printf '%s\n' 'first' > "$SETUP_TMPDIR/a/review.md" && printf '%s\n' 'last' > "$SETUP_TMPDIR/b/review.md" && printf '%s\n' 'unique' > "$SETUP_TMPDIR/unique.md"
    When the user installs all three: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --prompt ./unique.md --command ./a/review.md --command ./b/review.md > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exit.txt"
    Then the exit code is 1: grep -q '^1$' "$SETUP_TMPDIR/exit.txt"
    And no command directory was created: test ! -e "$SETUP_TMPDIR/.claude"
    And the unique prompt was not written: test ! -e "$SETUP_TMPDIR/CLAUDE.md"
    And the conflict includes retry guidance: grep -q -- '--overwrite' "$SETUP_TMPDIR/out.txt"

  @P0
  Scenario: Overwrite installs the last declared duplicate
    Given a temp working directory is created
    And two conflicting commands exist: mkdir -p "$SETUP_TMPDIR/a" "$SETUP_TMPDIR/b" && printf '%s\n' 'first' > "$SETUP_TMPDIR/a/review.md" && printf '%s\n' 'last' > "$SETUP_TMPDIR/b/review.md"
    When the user overwrites conflicts: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --command ./a/review.md --command ./b/review.md --overwrite
    Then the exit code is 0
    And the last content wins: grep -q '^last$' "$SETUP_TMPDIR/.claude/commands/review.md"
