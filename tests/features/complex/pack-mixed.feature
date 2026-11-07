Feature: Pack mixed skip/install and capability validation

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P1
  Scenario: Codex rejects an unsupported mixed Pack before any writes
    Given an isolated project and HOME with the codex-manifest.json fixture and all its sources
    When the Pack is installed on codex
    Then the CLI exits 2 and identifies the unsupported command asset
    And no Codex MCP, prompt, Skill or sub-agent is installed

  @P1
  Scenario: Explicit flag for unsupported asset type exits with code 2
    Given a temp working directory is created
    And a .roo directory exists: mkdir -p "$SETUP_TMPDIR/.roo"
    And the sub-agent fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/sub-agent/my-agent.md" "$SETUP_TMPDIR/my-agent.md"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host roo-code --sub-agent ./my-agent.md > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the exit code is 2: grep -q "^2$" "$SETUP_TMPDIR/exitcode.txt"
    And the output mentions unsupported: grep -qi "does not support" "$SETUP_TMPDIR/out.txt"

  @P1
  Scenario: Roo accepts a supported Pack and rejects an unsupported mixed Pack
    Given an isolated project and HOME with all fixture sources
    When the complete fixture Pack including subAgent is installed on roo-code
    Then the CLI exits 2 and no asset is written
    When the subAgent descriptor is removed and the remaining Pack is installed
    Then the CLI exits 0 and reports 4 written, 0 overwritten and 0 errors
    And MCP decodes to its source fixture and prompt, Skill and command bytes match their sources

  @P1
  Scenario: A same-name MCP is overwritten successfully
    Given an isolated project and HOME with a different installed playwright entry
    When the playwright fixture is installed on cursor
    Then the CLI exits 0, reports overwritten and the decoded entry exactly matches the fixture
