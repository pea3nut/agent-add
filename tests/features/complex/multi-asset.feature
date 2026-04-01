Feature: Multi-asset combined installation

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: Two MCP flags in one command on Cursor
    Given a temp working directory is created
    And MCP fixtures are copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json" && cp "$PROJECT_ROOT/tests/fixtures/mcp/filesystem.json" "$SETUP_TMPDIR/filesystem.json"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright.json --mcp ./filesystem.json
    Then the exit code is 0
    And the playwright key exists: grep -q '"playwright"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the filesystem key exists: grep -q '"filesystem"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P0
  Scenario: All 5 asset types in one command on Cursor
    Given a temp working directory is created
    And all fixtures are copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json" && cp -r "$PROJECT_ROOT/tests/fixtures/skill/my-skill" "$SETUP_TMPDIR/my-skill" && cp "$PROJECT_ROOT/tests/fixtures/prompt/my-prompt.md" "$SETUP_TMPDIR/my-prompt.md" && cp "$PROJECT_ROOT/tests/fixtures/command/my-command.md" "$SETUP_TMPDIR/my-command.md" && cp "$PROJECT_ROOT/tests/fixtures/sub-agent/my-agent.md" "$SETUP_TMPDIR/my-agent.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright.json --skill ./my-skill --prompt ./my-prompt.md --command ./my-command.md --sub-agent ./my-agent.md
    Then the exit code is 0
    And the MCP config exists: grep -q '"playwright"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the skill is installed: test -f "$SETUP_TMPDIR/.cursor/skills/my-skill/SKILL.md"
    And the prompt is installed: grep -q 'agent-add:my-prompt' "$SETUP_TMPDIR/AGENTS.md"
    And the command is installed: test -f "$SETUP_TMPDIR/.cursor/commands/my-command.md"
    And the sub-agent is installed: test -f "$SETUP_TMPDIR/.cursor/agents/my-agent.md"

  @P1
  Scenario: Pack plus explicit MCP flag on Claude Code
    Given a temp working directory is created
    And all fixtures are copied: cp -r "$PROJECT_ROOT/tests/fixtures" "$SETUP_TMPDIR/fixtures" && cp "$PROJECT_ROOT/tests/fixtures/mcp/filesystem.json" "$SETUP_TMPDIR/filesystem.json"
    And a .claude directory exists: mkdir -p "$SETUP_TMPDIR/.claude"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --pack ./fixtures/pack/manifest.json --mcp ./filesystem.json
    Then the exit code is 0
    And pack MCP is installed: grep -q '"playwright"' "$SETUP_TMPDIR/.mcp.json"
    And explicit MCP is installed: grep -q '"filesystem"' "$SETUP_TMPDIR/.mcp.json"
    And pack prompt is installed: grep -q 'agent-add:my-prompt' "$SETUP_TMPDIR/CLAUDE.md"
    And pack skill is installed: test -d "$SETUP_TMPDIR/.claude/skills/my-skill"
    And pack command is installed: test -f "$SETUP_TMPDIR/.claude/commands/my-command.md"
    And pack sub-agent is installed: test -f "$SETUP_TMPDIR/.claude/agents/my-agent.md"

  @P1
  Scenario: Pack with source array installs multiple assets of same type
    Given a temp working directory is created
    And all fixtures are copied: cp -r "$PROJECT_ROOT/tests/fixtures" "$SETUP_TMPDIR/fixtures"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --pack ./fixtures/pack/multi-source-manifest.json
    Then the exit code is 0
    And both MCPs are installed: grep -q '"playwright"' "$SETUP_TMPDIR/.cursor/mcp.json" && grep -q '"filesystem"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And both prompts are installed: grep -q 'agent-add:my-prompt' "$SETUP_TMPDIR/AGENTS.md" && grep -q 'agent-add:second-prompt' "$SETUP_TMPDIR/AGENTS.md"
