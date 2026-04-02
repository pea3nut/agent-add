Feature: Git source @ref syntax

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P1 @network
  Scenario: Install MCP from HTTPS git URL with @branch and #subpath
    Given a temp working directory is created
    And the cursor host directory is created: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user installs MCP from git with branch: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --mcp "https://github.com/modelcontextprotocol/servers.git@main#.mcp.json" --host cursor > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the exit code is 0: grep -q "^0$" "$SETUP_TMPDIR/exitcode.txt"
    And the MCP config file exists: test -f "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP key uses unwrapped server name: grep -q '"mcp-docs"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P1 @network
  Scenario: Install MCP from HTTPS git URL with @branch and #subpath on non-default branch
    Given a temp working directory is created
    And the cursor host directory is created: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user installs MCP from a non-default branch: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --mcp "https://github.com/modelcontextprotocol/servers.git@feat/url-elicitation#.mcp.json" --host cursor > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the exit code is 0: grep -q "^0$" "$SETUP_TMPDIR/exitcode.txt"
    And the MCP config file exists: test -f "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP key uses unwrapped server name: grep -q '"mcp-docs"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P1 @network
  Scenario: Install MCP from HTTPS git URL with @tag and #subpath
    Given a temp working directory is created
    And the cursor host directory is created: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user installs MCP from a git tag: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --mcp "https://github.com/modelcontextprotocol/servers.git@2026.1.26#.mcp.json" --host cursor > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the exit code is 0: grep -q "^0$" "$SETUP_TMPDIR/exitcode.txt"
    And the MCP config file exists: test -f "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP key uses unwrapped server name: grep -q '"mcp-docs"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P1 @network @skip
  Scenario: Install Skill from git SSH URL with @branch and #subpath
    Given a temp working directory is created
    And the claude-code host directory is created: mkdir -p "$SETUP_TMPDIR/.claude/agents"
    When the user installs Skill from SSH git with branch: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --skill "git@github.com:pea3nut/agent-add-fixtures.git@main#skill/my-skill" --host claude-code > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the exit code is 0: grep -q "^0$" "$SETUP_TMPDIR/exitcode.txt"
    And the skill directory exists: test -d "$SETUP_TMPDIR/.claude/agents/my-skill"
