Feature: Pack installation on Cursor

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: Install pack on Cursor deploys all assets
    Given a temp working directory is created
    And all fixtures are copied: cp -r "$PROJECT_ROOT/tests/fixtures" "$SETUP_TMPDIR/fixtures"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --pack ./fixtures/pack/manifest.json
    Then the exit code is 0

  @P0
  Scenario: Pack install creates all asset files
    Given a temp working directory is created
    And all fixtures are copied: cp -r "$PROJECT_ROOT/tests/fixtures" "$SETUP_TMPDIR/fixtures"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --pack ./fixtures/pack/manifest.json
    Then the MCP config exists: test -f "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP key exists: grep -q '"playwright"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the skill directory exists: test -d "$SETUP_TMPDIR/.cursor/skills/my-skill"
    And the SKILL.md has correct content: grep -q 'test skill' "$SETUP_TMPDIR/.cursor/skills/my-skill/SKILL.md"
    And the AGENTS.md exists: test -f "$SETUP_TMPDIR/AGENTS.md"
    And the prompt marker exists: grep -q '<!-- agent-add:my-prompt -->' "$SETUP_TMPDIR/AGENTS.md"
    And the command file exists: test -f "$SETUP_TMPDIR/.cursor/commands/my-command.md"
    And the command has correct content: grep -q 'test command' "$SETUP_TMPDIR/.cursor/commands/my-command.md"
    And the sub-agent file exists: test -f "$SETUP_TMPDIR/.cursor/agents/my-agent.md"
    And the sub-agent has correct content: grep -q 'test sub-agent' "$SETUP_TMPDIR/.cursor/agents/my-agent.md"

  @P1
  Scenario: An unsupported project Pack fails before writing any asset
    Given an isolated project and HOME with all fixtures copied
    When the complete fixture Pack is installed on claude-desktop without --global
    Then the CLI exits 2 with an unsupported asset explanation
    And no project or user destination is written and no skipped success is reported
