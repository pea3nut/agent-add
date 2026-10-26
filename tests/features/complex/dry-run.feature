Feature: Read-only installation previews

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: Preview a new command and prompt without creating targets or staging files
    Given a temp working directory is created
    And the sources exist: printf '%s\n' 'command' > "$SETUP_TMPDIR/review.md" && printf '%s\n' 'prompt' > "$SETUP_TMPDIR/rules.md"
    When the user previews the install: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --command ./review.md --prompt ./rules.md --dry-run > "$SETUP_TMPDIR/out.txt" 2>&1
    Then the exit code is 0
    And both writes appear as previews: test "$(grep -c 'would-write' "$SETUP_TMPDIR/out.txt")" -ge 2
    And no installation targets were created: test ! -e "$SETUP_TMPDIR/.claude" && test ! -e "$SETUP_TMPDIR/CLAUDE.md"
    And no staging files were created: test -z "$(find "$SETUP_TMPDIR" -name '.agent-add-stage-*' -print -quit)"

  @P0
  Scenario: Preview an existing target before and after adding overwrite
    Given a temp working directory is created
    And the source and existing target differ: mkdir -p "$SETUP_TMPDIR/.claude/commands" && printf '%s\n' 'old' > "$SETUP_TMPDIR/.claude/commands/review.md" && printf '%s\n' 'new' > "$SETUP_TMPDIR/review.md"
    When the user previews without overwrite: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --command ./review.md --dry-run > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exit.txt"
    Then it exits with conflict without touching the target: grep -q '^1$' "$SETUP_TMPDIR/exit.txt" && grep -q 'would-conflict' "$SETUP_TMPDIR/out.txt" && grep -q '^old$' "$SETUP_TMPDIR/.claude/commands/review.md"
    And the retry example stays a preview: grep -Eq 'Example:.*--overwrite --dry-run' "$SETUP_TMPDIR/out.txt"
    When the user previews with overwrite: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --command ./review.md --dry-run --overwrite > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exit.txt"
    Then the exit code is 0: grep -q '^0$' "$SETUP_TMPDIR/exit.txt"
    And update is shown without performing it: grep -q 'would-update' "$SETUP_TMPDIR/out.txt" && grep -q '^old$' "$SETUP_TMPDIR/.claude/commands/review.md"

  @P0
  Scenario: Previews honor pack and CLI source order and show the final winner
    Given a temp working directory is created
    And a pack and override exist: mkdir -p "$SETUP_TMPDIR/a" "$SETUP_TMPDIR/b" && printf '%s\n' 'pack' > "$SETUP_TMPDIR/a/review.md" && printf '%s\n' 'cli' > "$SETUP_TMPDIR/b/review.md" && printf '{"name":"pack/test","assets":[{"type":"command","source":"./a/review.md"}]}' > "$SETUP_TMPDIR/pack.json"
    When the user previews a mixed install: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --pack ./pack.json --command ./b/review.md --dry-run --overwrite > "$SETUP_TMPDIR/out.txt" 2>&1
    Then the exit code is 0
    And the pack entry is superseded and the CLI entry would win: grep -q 'replaced by later source' "$SETUP_TMPDIR/out.txt" && grep -q 'would-write.*command/review' "$SETUP_TMPDIR/out.txt"
    And no command is installed: test ! -e "$SETUP_TMPDIR/.claude"

  @P0
  Scenario: A duplicate conflict prevents other would-write results
    Given a temp working directory is created
    And duplicate commands and a unique prompt exist: mkdir -p "$SETUP_TMPDIR/a" "$SETUP_TMPDIR/b" && printf '%s\n' 'a' > "$SETUP_TMPDIR/a/review.md" && printf '%s\n' 'b' > "$SETUP_TMPDIR/b/review.md" && printf '%s\n' 'unique' > "$SETUP_TMPDIR/unique.md"
    When the user previews all inputs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --prompt ./unique.md --command ./a/review.md --command ./b/review.md --dry-run > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exit.txt"
    Then it reports conflicts and a blocked prompt: grep -q '^1$' "$SETUP_TMPDIR/exit.txt" && grep -q 'would-conflict' "$SETUP_TMPDIR/out.txt" && grep -q 'preflight failed' "$SETUP_TMPDIR/out.txt"
    And no target file was created: test ! -e "$SETUP_TMPDIR/CLAUDE.md" && test ! -e "$SETUP_TMPDIR/.claude"

  @P1
  Scenario: A malformed Gemini command still fails validation in a dry run
    Given a temp working directory is created
    And the valid and invalid sources exist: mkdir -p "$SETUP_TMPDIR/.gemini" && printf '%s\n' 'valid' > "$SETUP_TMPDIR/valid.md" && printf '%s\n' '---' 'description: [broken' '---' '# Bad' > "$SETUP_TMPDIR/bad.md"
    When the user previews both commands: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host gemini --command ./valid.md --command ./bad.md --dry-run --overwrite > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exit.txt"
    Then it fails validation and does not install the valid command: grep -q '^1$' "$SETUP_TMPDIR/exit.txt" && grep -q 'Failed to convert command source to TOML' "$SETUP_TMPDIR/out.txt" && test ! -e "$SETUP_TMPDIR/.gemini/commands"

  @P1
  Scenario: Preview a skill replacement without deleting old user files
    Given a temp working directory is created
    And a new skill and the installed skill exist: mkdir -p "$SETUP_TMPDIR/new/pdf" "$SETUP_TMPDIR/.claude/skills/pdf" && printf '%s\n' 'new' > "$SETUP_TMPDIR/new/pdf/SKILL.md" && printf '%s\n' 'old' > "$SETUP_TMPDIR/.claude/skills/pdf/SKILL.md" && printf '%s\n' 'user data' > "$SETUP_TMPDIR/.claude/skills/pdf/custom.txt"
    When the user previews overwrite: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --skill ./new/pdf --dry-run --overwrite > "$SETUP_TMPDIR/out.txt" 2>&1
    Then the exit code is 0
    And the directory is planned for replacement: grep -q 'would-update.*skill/pdf' "$SETUP_TMPDIR/out.txt"
    And user files still exist after the preview: grep -q '^old$' "$SETUP_TMPDIR/.claude/skills/pdf/SKILL.md" && grep -q '^user data$' "$SETUP_TMPDIR/.claude/skills/pdf/custom.txt"

  @P0
  Scenario: Preview a prompt marker change without touching user-authored text
    Given a temp working directory is created
    And the first version of the prompt exists: printf '%s\n' 'old prompt' > "$SETUP_TMPDIR/rules.md"
    And the prompt is installed and surrounded by user text: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --prompt ./rules.md > /dev/null && printf '%s\n' 'User note' >> "$SETUP_TMPDIR/CLAUDE.md" && cp "$SETUP_TMPDIR/CLAUDE.md" "$SETUP_TMPDIR/before.txt" && printf '%s\n' 'new prompt' > "$SETUP_TMPDIR/rules.md"
    When the user previews the marker replacement: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --prompt ./rules.md --dry-run --overwrite > "$SETUP_TMPDIR/out.txt" 2>&1
    Then the exit code is 0
    And the prompt block would update but the file was not touched: grep -q 'would-update.*prompt/rules' "$SETUP_TMPDIR/out.txt" && cmp -s "$SETUP_TMPDIR/CLAUDE.md" "$SETUP_TMPDIR/before.txt"

  @P0
  Scenario: Preview scoped MCP updates in JSON and TOML without writing configuration
    Given a temp working directory is created
    And MCP files and configurations already exist: mkdir -p "$SETUP_TMPDIR/.vibe" && printf '%s\n' '{"command":"new"}' > "$SETUP_TMPDIR/tool.json" && printf '%s\n' '{"custom":true,"mcpServers":{"keep":{"command":"keep"},"tool":{"command":"old"}}}' > "$SETUP_TMPDIR/.mcp.json" && printf 'theme = "dark"\n[[mcp_servers]]\nname = "keep"\ncommand = "keep"\n[[mcp_servers]]\nname = "tool"\ncommand = "old"\n' > "$SETUP_TMPDIR/.vibe/config.toml" && cp "$SETUP_TMPDIR/.mcp.json" "$SETUP_TMPDIR/json-before.txt" && cp "$SETUP_TMPDIR/.vibe/config.toml" "$SETUP_TMPDIR/toml-before.txt"
    When the user previews both formats: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --mcp ./tool.json --dry-run --overwrite > "$SETUP_TMPDIR/json-out.txt" 2>&1 && node "$PROJECT_ROOT/bin/agent-add.js" --host vibe --mcp ./tool.json --dry-run --overwrite > "$SETUP_TMPDIR/toml-out.txt" 2>&1
    Then the exit code is 0
    And both server updates are previews only: grep -q 'would-update.*mcp/tool' "$SETUP_TMPDIR/json-out.txt" && grep -q 'would-update.*mcp/tool' "$SETUP_TMPDIR/toml-out.txt" && cmp -s "$SETUP_TMPDIR/.mcp.json" "$SETUP_TMPDIR/json-before.txt" && cmp -s "$SETUP_TMPDIR/.vibe/config.toml" "$SETUP_TMPDIR/toml-before.txt"

  @P1
  Scenario: Dry-run overwrite does not bypass a symbolic-link target
    Given a temp working directory is created
    And the installed command is a symbolic link: mkdir -p "$SETUP_TMPDIR/.claude/commands" && printf '%s\n' 'user content' > "$SETUP_TMPDIR/user.md" && printf '%s\n' 'new' > "$SETUP_TMPDIR/review.md" && ln -s "$SETUP_TMPDIR/user.md" "$SETUP_TMPDIR/.claude/commands/review.md"
    When the user previews with overwrite: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --command ./review.md --dry-run --overwrite > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exit.txt"
    Then it rejects the link and does not follow it: grep -q '^1$' "$SETUP_TMPDIR/exit.txt" && grep -qi 'symbolic link' "$SETUP_TMPDIR/out.txt" && grep -q '^user content$' "$SETUP_TMPDIR/user.md" && test -L "$SETUP_TMPDIR/.claude/commands/review.md"
