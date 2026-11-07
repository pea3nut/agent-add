Feature: Skill copies do not follow symbolic links

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)
    And an isolated project and HOME with a complete sample Skill and helper.txt are created

  @P0
  Scenario: A destination file symlink cannot overwrite a file outside the Skill
    Given .cursor/skills/sample exists without SKILL.md
    And its helper.txt is a symbolic link to an external sentinel containing KEEP
    When the CLI installs the sample Skill on cursor
    Then installation fails with a symbolic link explanation
    And the sentinel is unchanged and the symbolic link is preserved
    And no SKILL.md is written to the destination

  @P0
  Scenario: A linked destination directory or parent is rejected before copying
    Given .cursor/skills is a symbolic link to an external empty directory
    When the CLI installs the sample Skill on cursor
    Then installation fails and the external directory remains empty
    And the symbolic link remains unchanged

  @P0
  Scenario: Source symbolic links are rejected without copying their referents
    Given a source Skill contains a symbolic link to a private file outside the source
    When the CLI installs the sample Skill on cursor
    Then installation fails with a symbolic link explanation
    And no destination Skill is created and the private file is unchanged

  @P1
  Scenario: Regular nested Skill files still copy completely
    Given the source Skill has nested helpers and binary supporting files
    When the CLI installs the sample Skill on cursor
    Then the exit code is 0 and every installed file exactly matches its source bytes

  @P1
  Scenario: A trusted home alias is supported without trusting links inside host directories
    Given HOME is a symbolic link to an isolated real home directory
    When the sample Skill is installed with --global --host claude-code
    Then installation succeeds and the complete Skill bundle is in the real home's .claude/skills/sample
    And the HOME alias itself is preserved
    When that home's .claude/skills is replaced with a symbolic link to an external empty directory
    Then a subsequent Skill install fails and the external directory remains empty
