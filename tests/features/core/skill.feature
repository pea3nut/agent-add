Feature: Skill installation on Cursor

  @P0
  Scenario: Install valid skill on Cursor succeeds
    Given a temp working directory is created
    And the skill fixture is copied: cp -r /e/_pea3nut/projects/agent-get/tests/fixtures/skill/my-skill "$SETUP_TMPDIR/my-skill"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor --skill ./my-skill
    Then the exit code is 0

  @P0
  Scenario: Skill install creates directory with SKILL.md entry
    Given a temp working directory is created
    And the skill fixture is copied: cp -r /e/_pea3nut/projects/agent-get/tests/fixtures/skill/my-skill "$SETUP_TMPDIR/my-skill"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor --skill ./my-skill
    Then the skill directory exists: test -d "$SETUP_TMPDIR/.cursor/skills/my-skill"
    And the SKILL.md entry exists: test -f "$SETUP_TMPDIR/.cursor/skills/my-skill/SKILL.md"

  @P1
  Scenario: Repeated skill install returns exists
    Given a temp working directory is created
    And the skill fixture is copied: cp -r /e/_pea3nut/projects/agent-get/tests/fixtures/skill/my-skill "$SETUP_TMPDIR/my-skill"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And the skill is already installed: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor --skill ./my-skill
    When the user installs again: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor --skill ./my-skill
    Then the output contains "exists"

  @P1
  Scenario: Install invalid skill (missing SKILL.md) returns error
    Given a temp working directory is created
    And the bad-skill fixture is copied: cp -r /e/_pea3nut/projects/agent-get/tests/fixtures/skill/bad-skill "$SETUP_TMPDIR/bad-skill"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node /e/_pea3nut/projects/agent-get/bin/agent-get.js install --host cursor --skill ./bad-skill
    Then the exit code is non-zero
