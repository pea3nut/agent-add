Feature: Sub-agent frontmatter processing and conflict detection

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: Sub-agent on Cursor expands cursor-specific frontmatter fields
    Given a temp working directory is created
    And the sub-agent fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/sub-agent/my-agent.md" "$SETUP_TMPDIR/my-agent.md"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --sub-agent ./my-agent.md
    Then the exit code is 0
    And the cursor name field is expanded: grep -q 'cursor-agent' "$SETUP_TMPDIR/.cursor/agents/my-agent.md"
    And no agent-get prefixed fields remain: ! grep -q 'agent-add/' "$SETUP_TMPDIR/.cursor/agents/my-agent.md"
    And the description field is preserved: grep -q 'test sub-agent' "$SETUP_TMPDIR/.cursor/agents/my-agent.md"

  @P0
  Scenario: Sub-agent on Claude Code expands claude-code-specific frontmatter fields
    Given a temp working directory is created
    And the sub-agent fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/sub-agent/my-agent.md" "$SETUP_TMPDIR/my-agent.md"
    And a .claude directory exists: mkdir -p "$SETUP_TMPDIR/.claude"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --sub-agent ./my-agent.md
    Then the exit code is 0
    And the claude-code name field is expanded: grep -q 'claude-agent' "$SETUP_TMPDIR/.claude/agents/my-agent.md"
    And no agent-get prefixed fields remain: ! grep -q 'agent-add/' "$SETUP_TMPDIR/.claude/agents/my-agent.md"
    And the description field is preserved: grep -q 'test sub-agent' "$SETUP_TMPDIR/.claude/agents/my-agent.md"

  @P1
  Scenario: A different installed sub-agent is overwritten in its native format
    Given an isolated project and HOME with a different installed my-agent sub-agent
    When the sub-agent fixture is installed on cursor
    Then the CLI exits 0 and reports overwritten
    And generated metadata applies Cursor overrides and the body matches the source fixture

  @P0
  Scenario: Codex and Vibe sub-agents use native TOML with inline instructions
    Given isolated Codex and Vibe projects with the existing sub-agent fixture and host-specific metadata
    When the sub-agent is installed and reinstalled on each host
    Then Codex generates valid TOML with name, description and developer_instructions rather than renamed Markdown
    And Vibe writes agent_type subagent and inline instructions preserving the Markdown body
    And external system_prompt_id dependencies are rejected rather than installing incomplete sub-agents
    And reinstalling identical sources reports overwritten without changing the generated file

  @P0
  Scenario: Host metadata overrides generic frontmatter independently of ordering and line endings
    Given equivalent sub-agent sources with generic and host-specific fields in both orders, including BOM, CRLF, trailing delimiter whitespace and quoted multiline YAML containing --- prefixed text
    When the sources are installed on their selected hosts
    Then host overrides win, generic descriptions remain, other hosts' overrides disappear and the Markdown body is preserved

  @P0
  Scenario: Sub-agent frontmatter parsing rejects malformed metadata without interpreting other languages
    Given sub-agent sources with unterminated YAML, non-mapping YAML roots and duplicate keys, plus plain Markdown and empty frontmatter
    When each source is installed on Cursor
    Then malformed YAML fails without creating or changing the target file
    And plain Markdown and empty or comment-only frontmatter preserve their normalized body
    And language-tagged fences such as ---javascript remain plain text and never execute code
