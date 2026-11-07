Feature: Install summaries distinguish writes from unchanged assets

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)
    And an isolated project and HOME are created

  @P0
  Scenario: Reinstalling an identical command reports exists and zero writes
    Given a command has been installed and its bytes and modification time are saved
    When the identical command is installed again
    Then the exit code is 0 and the item is reported as exists
    And the summary reports 0 written, 0 updated and 1 exists
    And installed bytes and modification time are unchanged

  @P0
  Scenario: A changed managed prompt counts as updated instead of written
    Given a prompt has been installed and its source body changes without changing its name
    When the prompt is installed again
    Then the exit code is 0 and the summary reports 0 written, 1 updated and 0 exists
    And the installed marker block contains the changed body exactly once

  @P1
  Scenario: A mixed batch counts new existing and conflicting commands separately
    Given same.md and conflict.md are installed and conflict.md is changed at its source
    And new.md has not been installed
    When same.md, conflict.md and new.md are installed together
    Then the exit code is 1 and the existing conflicting target remains unchanged
    And the summary reports 1 written, 0 updated, 1 exists, 0 skipped, 1 conflicts and 0 errors

  @P1
  Scenario: An asset error is explicitly counted without a fictitious write
    Given CLAUDE.md is a directory rather than a writable prompt file
    When a prompt is installed on claude-code
    Then the exit code is 1 and the summary reports 0 written, 0 updated, 0 exists and 1 errors
