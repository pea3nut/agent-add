Feature: Hosts without project MCP targets reject installation

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: Claude Desktop MCP is unsupported without a project contract
    Given a temp working directory is created
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-desktop --mcp '{"demo":{"command":"npx"}}' > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the recorded CLI exit code is 2: test "$(cat "$SETUP_TMPDIR/exitcode.txt")" -eq 2
    And the output explains the boundary: grep -q 'No verified project-level MCP' "$SETUP_TMPDIR/out.txt"
    And no guessed project MCP target is created: test ! -e "$SETUP_TMPDIR/.mcp.json" && test ! -e "$SETUP_TMPDIR/.claude"
