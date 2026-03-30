Feature: Claude Code host basic installation

  @P1
  Scenario: Install MCP on Claude Code host
    Given a temp working directory is created
    And the MCP fixture is copied: cp /e/_pea3nut/projects/agent-get/tests/fixtures/mcp/playwright.json "$SETUP_TMPDIR/playwright.json"
    And a .claude directory exists: mkdir -p "$SETUP_TMPDIR/.claude"
    When the user runs: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host claude-code ./playwright.json
    Then the config file exists: test -f "$SETUP_TMPDIR/.mcp.json"
    And the MCP key exists: jq -e '.mcpServers.playwright' "$SETUP_TMPDIR/.mcp.json"

  @P1
  Scenario: Install skill on Claude Code host
    Given a temp working directory is created
    And the skill fixture is copied: cp -r /e/_pea3nut/projects/agent-get/tests/fixtures/skill/my-skill "$SETUP_TMPDIR/my-skill"
    And a .claude directory exists: mkdir -p "$SETUP_TMPDIR/.claude"
    When the user runs: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host claude-code --skill ./my-skill
    Then the skill directory exists: test -d "$SETUP_TMPDIR/.claude/skills/my-skill"
    And the SKILL.md entry exists: test -f "$SETUP_TMPDIR/.claude/skills/my-skill/SKILL.md"

  @P1
  Scenario: Install prompt on Claude Code host
    Given a temp working directory is created
    And the prompt fixture is copied: cp /e/_pea3nut/projects/agent-get/tests/fixtures/prompt/my-prompt.md "$SETUP_TMPDIR/my-prompt.md"
    And a .claude directory exists: mkdir -p "$SETUP_TMPDIR/.claude"
    When the user runs: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host claude-code --prompt ./my-prompt.md
    Then the CLAUDE.md file exists: test -f "$SETUP_TMPDIR/CLAUDE.md"
    And the opening marker exists: grep -q '<!-- agent-get:my-prompt -->' "$SETUP_TMPDIR/CLAUDE.md"

  @P1
  Scenario: Install command on Claude Code host
    Given a temp working directory is created
    And the command fixture is copied: cp /e/_pea3nut/projects/agent-get/tests/fixtures/command/my-command.md "$SETUP_TMPDIR/my-command.md"
    And a .claude directory exists: mkdir -p "$SETUP_TMPDIR/.claude"
    When the user runs: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host claude-code --command ./my-command.md
    Then the command file exists: test -f "$SETUP_TMPDIR/.claude/commands/my-command.md"

  @P1
  Scenario: Install sub-agent on Claude Code host
    Given a temp working directory is created
    And the sub-agent fixture is copied: cp /e/_pea3nut/projects/agent-get/tests/fixtures/sub-agent/my-agent.md "$SETUP_TMPDIR/my-agent.md"
    And a .claude directory exists: mkdir -p "$SETUP_TMPDIR/.claude"
    When the user runs: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host claude-code --sub-agent ./my-agent.md
    Then the sub-agent file exists: test -f "$SETUP_TMPDIR/.claude/agents/my-agent.md"
