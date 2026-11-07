Feature: Skill names do not conceal different or incomplete bundles

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)
    And an isolated project and HOME are created

  @P0
  Scenario: Identical complete bundles report exists without touching installed files
    Given sample is installed with nested resources and binary helper files
    And installed file bytes and modification times are recorded
    When the identical complete Skill is installed again
    Then the exit code is 0 and the item reports exists
    And every installed byte and modification time is unchanged

  @P0
  Scenario: Different same-name Skills in one invocation explicitly skip the second source
    Given a/sample and b/sample have different SKILL.md and supporting files
    When both Skills are installed together on cursor
    Then the exit code is 0 and the first bundle is written in full
    And the second item reports skipped with a different-content explanation
    And the first bundle is not overwritten and there is no misleading exists item

  @P0
  Scenario: A helper-only change is skipped even when SKILL.md is identical
    Given sample is installed and only its source helper changes
    When sample is installed again
    Then the exit code is 0 and the item is skipped with a reason
    And the complete installed bundle is unchanged

  @P0
  Scenario: An incomplete legacy bundle is skipped rather than called identical
    Given source sample contains SKILL.md and helpers/tool.txt
    And the installed sample contains only SKILL.md
    When sample is installed again
    Then the item reports skipped and explains different or incomplete content
    And no exists item is emitted and the existing file is unchanged

  @P0
  Scenario: A nonempty incomplete target without SKILL.md is also explicitly skipped
    Given .cursor/skills/sample contains a user helper file but no SKILL.md
    When the complete source sample is installed
    Then the exit code is 0 and the item reports skipped with an incomplete-content explanation
    And the existing helper file is unchanged and no source files are copied
