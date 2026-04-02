Feature: README.zh-CN.md documentation examples

  Verify that all CLI examples shown in docs/README.zh-CN.md work correctly.

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  # === MCP: Inline JSON (Format A - top-level key as name) ===

  @P0
  Scenario: Install MCP from inline JSON on Cursor (README format A)
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}'
    Then the exit code is 0
    And the config file exists: test -f "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP key exists: grep -q '"playwright"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the command value is correct: grep -q '"npx"' "$SETUP_TMPDIR/.cursor/mcp.json"

  # === MCP: Inline JSON (Format B - mcpServers wrapper) ===

  @P0
  Scenario: Install MCP from inline JSON with mcpServers wrapper (README format B)
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp '{"mcpServers":{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}}'
    Then the exit code is 0
    And the config file exists: test -f "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP key exists: grep -q '"playwright"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the command is unwrapped correctly: grep -q '"npx"' "$SETUP_TMPDIR/.cursor/mcp.json"

  # === Prompt: Inline Markdown on Claude Code ===

  @P0
  Scenario: Install inline prompt on Claude Code (README example)
    Given a temp working directory is created
    And a .claude directory exists: mkdir -p "$SETUP_TMPDIR/.claude"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --prompt $'# Code Review Rules\n\nAlways review for security issues first.'
    Then the exit code is 0
    And the CLAUDE.md file exists: test -f "$SETUP_TMPDIR/CLAUDE.md"
    And the marker exists: grep -q 'agent-add:code-review-rules' "$SETUP_TMPDIR/CLAUDE.md"
    And the content exists: grep -q 'Always review for security issues first' "$SETUP_TMPDIR/CLAUDE.md"

  # === Cross-host: Same MCP on Cursor, Claude Code, Codex ===

  @P0
  Scenario: Cross-host MCP on Cursor
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}'
    Then the exit code is 0
    And the Cursor MCP config exists: test -f "$SETUP_TMPDIR/.cursor/mcp.json"
    And the playwright key exists: grep -q '"playwright"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P0
  Scenario: Cross-host MCP on Claude Code
    Given a temp working directory is created
    And a .claude directory exists: mkdir -p "$SETUP_TMPDIR/.claude"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}'
    Then the exit code is 0
    And the Claude Code MCP config exists: test -f "$SETUP_TMPDIR/.mcp.json"
    And the playwright key exists: grep -q '"playwright"' "$SETUP_TMPDIR/.mcp.json"

  @P1
  Scenario: Cross-host MCP on Codex
    Given a temp working directory is created
    And a .codex directory exists: mkdir -p "$SETUP_TMPDIR/.codex"
    When the user runs: cd "$SETUP_TMPDIR" && WIN_TMPDIR=$(cygpath -w "$SETUP_TMPDIR" 2>/dev/null || echo "$SETUP_TMPDIR") && AGENT_ADD_HOME="$WIN_TMPDIR" node "$PROJECT_ROOT/bin/agent-add.js" --host codex --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}'
    Then the exit code is 0
    And the Codex TOML config exists: test -f "$SETUP_TMPDIR/.codex/config.toml"
    And the playwright entry exists in TOML: grep -q 'playwright' "$SETUP_TMPDIR/.codex/config.toml"

  # === MCP: From local JSON file ===

  @P0
  Scenario: Install MCP from local JSON file on Cursor
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright.json
    Then the exit code is 0
    And the config file exists: test -f "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP key exists: grep -q '"playwright"' "$SETUP_TMPDIR/.cursor/mcp.json"

  # === Prompt: Inline Markdown on Cursor ===

  @P0
  Scenario: Install inline prompt on Cursor (README Cursor example)
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --prompt $'# Code Review Rules\n\nAlways review for security issues first.\nUse bullet points for lists.'
    Then the exit code is 0
    And the AGENTS.md file exists: test -f "$SETUP_TMPDIR/AGENTS.md"
    And the marker exists: grep -q 'agent-add:code-review-rules' "$SETUP_TMPDIR/AGENTS.md"

  # === Network-dependent examples (tagged @network) ===

  @P1 @network
  Scenario: Install MCP from Git HTTPS on Cursor (README git example)
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp https://github.com/modelcontextprotocol/servers.git#.mcp.json
    Then the exit code is 0
    And the config file exists: test -f "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP key uses unwrapped server name: grep -q '"mcp-docs"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P1 @network
  Scenario: Install MCP from HTTP URL on Cursor
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp https://raw.githubusercontent.com/modelcontextprotocol/servers/main/.mcp.json
    Then the exit code is 0
    And the config file exists: test -f "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP key uses unwrapped server name: grep -q '"mcp-docs"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P1 @network
  Scenario: Install Skill from Git HTTPS on Cursor (README skill example)
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --skill https://github.com/anthropics/skills.git#skills/pdf
    Then the exit code is 0
    And the skill directory exists: test -d "$SETUP_TMPDIR/.cursor/skills/pdf"
    And the SKILL.md exists: test -f "$SETUP_TMPDIR/.cursor/skills/pdf/SKILL.md"
    And the SKILL.md is not empty: test -s "$SETUP_TMPDIR/.cursor/skills/pdf/SKILL.md"

  @P1 @network
  Scenario: Install Command from Git HTTPS on Cursor (README command example)
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --command https://github.com/wshobson/commands.git#tools/security-scan.md
    Then the exit code is 0
    And the command file exists: test -f "$SETUP_TMPDIR/.cursor/commands/security-scan.md"
    And the command file is not empty: test -s "$SETUP_TMPDIR/.cursor/commands/security-scan.md"

  @P1 @network
  Scenario: Install Sub-agent from Git HTTPS on Cursor (README sub-agent example)
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --sub-agent https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/01-core-development/backend-developer.md
    Then the exit code is 0
    And the sub-agent file exists: test -f "$SETUP_TMPDIR/.cursor/agents/backend-developer.md"
    And the sub-agent file is not empty: test -s "$SETUP_TMPDIR/.cursor/agents/backend-developer.md"

  @P1 @network
  Scenario: Install multiple sub-agents in one command (README batch example)
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --sub-agent https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/01-core-development/backend-developer.md --sub-agent https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/02-language-specialists/python-pro.md --sub-agent https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/04-quality-security/code-reviewer.md
    Then the exit code is 0
    And the backend-developer agent exists: test -f "$SETUP_TMPDIR/.cursor/agents/backend-developer.md"
    And the python-pro agent exists: test -f "$SETUP_TMPDIR/.cursor/agents/python-pro.md"
    And the code-reviewer agent exists: test -f "$SETUP_TMPDIR/.cursor/agents/code-reviewer.md"
