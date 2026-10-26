Feature: Gemini command installation and host-specific formats

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)
    And a temp working directory is created
    And an isolated home is configured: export HOME="$SETUP_TMPDIR/home" AGENT_ADD_HOME="$SETUP_TMPDIR/home" && mkdir -p "$HOME"

  @P0
  Scenario: Install a Markdown command as a usable Gemini TOML command
    Given a command with metadata and special characters is copied: cp "$PROJECT_ROOT/tests/fixtures/command/gemini-review.md" "$SETUP_TMPDIR/review.md"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host gemini --command ./review.md
    Then the exit code is 0
    And .gemini/commands/review.toml parses as valid TOML
    And its decoded prompt exactly preserves the Markdown body, including quotes, backslashes, Unicode, placeholders and the final newline, without the YAML frontmatter
    And its description matches the source description, while allowed-tools is not included in the TOML

  @P0
  Scenario: Install inline Markdown without frontmatter on Gemini
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host gemini --command $'# Review\n\nCheck {{args}}.'
    Then the exit code is 0
    And .gemini/commands/review.toml parses as valid TOML with only a prompt field
    And its decoded prompt is exactly the supplied inline Markdown

  @P1
  Scenario: Accept optional frontmatter and commands with an empty body
    Given a command directory is created: mkdir "$SETUP_TMPDIR/commands"
    And a command has empty frontmatter: printf '%s\n' '---' '---' '# Empty metadata' > "$SETUP_TMPDIR/commands/empty.md"
    And a command has no description: printf '%s\n' '---' 'name: ignored' '---' '# No description' > "$SETUP_TMPDIR/commands/no-description.md"
    And a command ends immediately after frontmatter: printf '%s' $'---\ndescription: Review\n---' > "$SETUP_TMPDIR/commands/no-body.md"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host gemini --command "./commands/*"
    Then the exit code is 0
    And every installed command parses as valid TOML
    And empty.toml and no-description.toml contain only prompt, matching their Markdown bodies with the final newline preserved
    And no-body.toml has description Review and an empty prompt string

  @P1
  Scenario: Preserve a command body with BOM and CRLF frontmatter
    Given a command uses BOM and CRLF: printf '%b' '\357\273\277---\r\ndescription: Review\r\n---\r\n# Review\r\nBody\r\n' > "$SETUP_TMPDIR/review.md"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host gemini --command ./review.md
    Then the exit code is 0
    And .gemini/commands/review.toml parses as valid TOML with description Review
    And its decoded prompt is exactly the original Markdown body, retaining CRLF line endings

  @P1
  Scenario: Reject invalid frontmatter without leaving broken Gemini commands
    Given a command directory is created: mkdir "$SETUP_TMPDIR/commands"
    And a command has malformed YAML: printf '%s\n' '---' 'description: [invalid' '---' '# Review' > "$SETUP_TMPDIR/commands/broken.md"
    And a command has list metadata: printf '%s\n' '---' '- item' '---' '# Review' > "$SETUP_TMPDIR/commands/list.md"
    And a command has scalar metadata: printf '%s\n' '---' '42' '---' '# Review' > "$SETUP_TMPDIR/commands/scalar.md"
    And a command has a numeric description: printf '%s\n' '---' 'description: 42' '---' '# Review' > "$SETUP_TMPDIR/commands/number.md"
    And a command has a null description: printf '%s\n' '---' 'description: null' '---' '# Review' > "$SETUP_TMPDIR/commands/null.md"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host gemini --command "./commands/*" > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the recorded CLI exit code is 1
    And every command is reported as an error with a reason beginning Failed to convert command source to TOML
    And none of the five target command files exists

  @P1
  Scenario: Reinstall an unchanged Gemini command without modifying it
    Given a command is copied: cp "$PROJECT_ROOT/tests/fixtures/command/gemini-review.md" "$SETUP_TMPDIR/review.md"
    And it is installed and saved for comparison: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host gemini --command ./review.md && cp .gemini/commands/review.toml before.toml
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host gemini --command ./review.md
    Then the exit code is 0
    And the output reports exists for command/review
    And the installed file is byte-for-byte unchanged from before.toml

  @P1
  Scenario: Preserve an installed Gemini command when its source changes
    Given a command is copied: cp "$PROJECT_ROOT/tests/fixtures/command/gemini-review.md" "$SETUP_TMPDIR/review.md"
    And it is installed and saved for comparison: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host gemini --command ./review.md && cp .gemini/commands/review.toml before.toml
    And the source changes: printf '%s\n' 'Changed instructions.' >> "$SETUP_TMPDIR/review.md"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host gemini --command ./review.md > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the recorded CLI exit code is 1
    And the output reports conflict for command/review
    And the installed file is byte-for-byte unchanged from before.toml

  @P1
  Scenario: Protect a raw Markdown command left by an older Gemini installation
    Given a command is copied: cp "$PROJECT_ROOT/tests/fixtures/command/gemini-review.md" "$SETUP_TMPDIR/review.md"
    And an old installation contains raw Markdown: mkdir -p "$SETUP_TMPDIR/.gemini/commands" && cp "$SETUP_TMPDIR/review.md" "$SETUP_TMPDIR/.gemini/commands/review.toml"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host gemini --command ./review.md > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the recorded CLI exit code is 1
    And the output reports conflict for command/review rather than exists
    And the existing target remains byte-for-byte identical to review.md

  @P1
  Scenario: Keep Markdown unchanged for a host that does not use TOML commands
    Given a command contains malformed YAML: printf '%s\n' '---' 'description: [invalid' '---' '# Review' > "$SETUP_TMPDIR/review.md"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --command ./review.md
    Then the exit code is 0
    And .cursor/commands/review.md is byte-for-byte identical to the source, including its frontmatter

  @P1
  Scenario: Install a mixed pack on Gemini using each asset's native format
    Given all fixtures are copied: cp -r "$PROJECT_ROOT/tests/fixtures" "$SETUP_TMPDIR/fixtures"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host gemini --pack ./fixtures/pack/manifest.json
    Then the exit code is 0
    And .gemini/settings.json is valid JSON containing the fixture MCP server under mcpServers.playwright
    And GEMINI.md contains the prompt fixture with its agent-add markers
    And .gemini/skills/my-skill/SKILL.md is byte-for-byte identical to its fixture
    And .gemini/agents/my-agent.md preserves the fixture's description and Markdown body, without other hosts' agent-add overrides
    And .gemini/commands/my-command.toml parses as valid TOML whose prompt and description match the command fixture's body and description
