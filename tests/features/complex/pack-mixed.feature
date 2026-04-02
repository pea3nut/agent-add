Feature: Pack mixed skip/install and capability validation

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P1
  Scenario: Pack on Codex installs MCP as TOML and prompt, skips unsupported types
    Given a temp working directory is created
    And all fixtures are copied: cp -r "$PROJECT_ROOT/tests/fixtures" "$SETUP_TMPDIR/fixtures"
    And the codex config directory exists: mkdir -p "$SETUP_TMPDIR/.codex"
    When the user runs: cd "$SETUP_TMPDIR" && AGENT_ADD_HOME="$SETUP_TMPDIR" node "$PROJECT_ROOT/bin/agent-add.js" --host codex --pack ./fixtures/pack/codex-manifest.json > "$SETUP_TMPDIR/out.txt" 2>&1
    Then the TOML config exists: test -f "$SETUP_TMPDIR/.codex/config.toml"
    And the MCP is installed in TOML: grep -q 'playwright' "$SETUP_TMPDIR/.codex/config.toml"
    And the prompt is installed: grep -q 'agent-add:my-prompt' "$SETUP_TMPDIR/AGENTS.md"
    And unsupported types are skipped: grep -qi "skipped" "$SETUP_TMPDIR/out.txt"

  @P1
  Scenario: Explicit flag for unsupported asset type exits with code 2
    Given a temp working directory is created
    And a .roo directory exists: mkdir -p "$SETUP_TMPDIR/.roo"
    And the sub-agent fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/sub-agent/my-agent.md" "$SETUP_TMPDIR/my-agent.md"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host roo-code --sub-agent ./my-agent.md > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the exit code is 2: grep -q "^2$" "$SETUP_TMPDIR/exitcode.txt"
    And the output mentions unsupported: grep -qi "does not support" "$SETUP_TMPDIR/out.txt"

  @P1
  Scenario: Pack on Roo Code installs MCP, prompt as file-in-dir, and skill, skips command and subAgent
    Given a temp working directory is created
    And all fixtures are copied: cp -r "$PROJECT_ROOT/tests/fixtures" "$SETUP_TMPDIR/fixtures"
    And a .roo directory exists: mkdir -p "$SETUP_TMPDIR/.roo"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host roo-code --pack ./fixtures/pack/manifest.json > "$SETUP_TMPDIR/out.txt" 2>&1
    Then the exit code is 0: echo $? > "$SETUP_TMPDIR/roo-exit.txt" || true
    And the MCP is installed: grep -q '"playwright"' "$SETUP_TMPDIR/.roo/mcp.json"
    And the prompt file is created in rules dir: test -f "$SETUP_TMPDIR/.roo/rules/my-prompt.md"
    And the skill is installed: test -d "$SETUP_TMPDIR/.roo/skills/my-skill"
    And command and subAgent are skipped: grep -qi "skipped" "$SETUP_TMPDIR/out.txt"

  @P1
  Scenario: MCP conflict in single-asset install exits with code 1
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And a conflicting mcp.json exists: printf '{"mcpServers":{"playwright":{"command":"different-command"}}}' > "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright.json > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the exit code is non-zero: test "$(cat "$SETUP_TMPDIR/exitcode.txt")" -ne 0
    And the output contains conflict: grep -qi "conflict" "$SETUP_TMPDIR/out.txt"
