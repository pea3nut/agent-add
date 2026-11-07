Feature: Failed Skill installation does not publish partial bundles

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)
    And an isolated project and HOME are created

  @P0
  Scenario: Mid-copy failure leaves no installed Skill and a repaired source can be retried
    Given sample contains readable SKILL.md and an unreadable z-helper.txt copied after SKILL.md
    When the CLI installs sample on cursor as an unprivileged user
    Then installation fails and .cursor/skills/sample does not exist
    And no .agent-add-skill temporary directory remains
    When z-helper.txt is made readable and the same install command is run again
    Then installation succeeds as written rather than exists
    And every installed file exactly matches the repaired source bytes

  @P0
  Scenario: A legacy partial Skill cannot be reported as already complete
    Given the source contains SKILL.md and helpers/tool.txt
    And the installed sample contains only SKILL.md
    When the CLI installs sample on cursor
    Then it reports that the existing Skill is incomplete rather than exists
    And the existing installed file remains byte-for-byte unchanged

  @P1
  Scenario: An empty interrupted target can be completed safely
    Given the source contains SKILL.md and nested supporting resources
    And an empty .cursor/skills/sample directory already exists
    When the CLI installs sample on cursor
    Then installation succeeds and the entire source bundle is installed
    And no temporary staging directory remains
