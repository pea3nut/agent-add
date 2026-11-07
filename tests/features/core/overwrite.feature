Feature: Every supported asset converges to the supplied content through overwrite

  Background:
    Given the CLI is built from this checkout and each scenario has isolated project, HOME and TMPDIR directories

  @P0
  Scenario: All five asset types overwrite identical and changed input successfully
    Given complete MCP, Skill, Prompt, Command and Sub-agent fixtures
    When all five are installed on cursor twice with identical sources
    Then both runs exit 0, the second reports 5 overwritten and no exists, skipped or conflict status
    And decoded MCP, native sub-agent metadata and every installed source byte are correct without duplicate markers
    When each source is changed and all five are installed again
    Then all five installed assets converge to the changed inputs with 5 overwritten and no duplicates
    And a third identical run produces byte-identical managed output

  @P0
  Scenario: Overwriting a Skill removes stale resources and repairs incomplete bundles
    Given an installed Skill has obsolete files and is missing required source helpers
    When the complete source Skill is installed
    Then it reports overwritten, every source file matches and obsolete target-only files are removed
    And repeating installation produces the same complete file tree with no temporary directory left behind

  @P0
  Scenario: A failed Skill overwrite preserves the old complete bundle and can be retried
    Given an installed complete Skill and a changed source with an unreadable file copied after SKILL.md
    When the Skill is overwritten as an unprivileged user
    Then the CLI fails and the complete old target bytes are unchanged
    And no partial bundle is published and no temporary directory remains
    When source permissions are repaired and installation is repeated
    Then the CLI succeeds with overwritten and installs the entire new source bundle

  @P0
  Scenario: A failed publish restores the previous Skill bundle
    Given a complete old Skill and a complete changed source
    When publication is forced to fail after the old bundle is moved to backup
    Then the previous bundle is restored byte-for-byte and installation reports an error
    And after the publication fault is removed a fresh run converges to the changed source

  @P0
  Scenario: Repeated MCP overwrites preserve unrelated JSON JSONC and TOML settings
    Given JSON, JSONC, Codex table TOML and Vibe named-array TOML configurations with unrelated settings
    When same-name MCP settings are installed, changed, and installed twice more
    Then each chosen entry exactly matches the newest native source without duplicate keys or array entries
    And unrelated settings remain semantically unchanged and the final two configurations have identical bytes
    And JSONC comments outside the overwritten entry are preserved

  @P0
  Scenario: Same-name sources are resolved deterministically with explicit flags last
    Given two ordered Packs and explicit flags contain different same-name assets of all five types
    When both Packs and repeated explicit flags are installed together
    Then installation succeeds and the last explicit source for each name wins
    And without explicit flags the last Pack source wins and repeat runs remain content-idempotent

  @P0
  Scenario: Managed prompt overwrites preserve user text and independent blocks
    Given a prompt file contains user text and two distinct managed blocks
    When one block is repeatedly installed with changed and identical content
    Then only that block changes, user text and the other block remain byte-for-byte intact and each marker occurs once
    And malformed or duplicate markers are still rejected without writes

  @P0
  Scenario: Invalid inputs and unsupported Pack assets remain errors before any write
    Given an existing project and user configuration snapshot
    When a batch contains a valid asset plus an invalid MCP or invalid native command or unsupported Pack asset
    Then it fails before modifying any project or user asset and does not claim a successful skip

  @P0
  Scenario: Skill overwrite retains symlink and directory-boundary protection
    Given a symlinked target, a target parent link, a source link or a destination nested inside the source
    When the complete Skill is installed in each isolated case
    Then each unsafe installation fails without changing any external referent or existing bundle
    And a trusted HOME alias still supports ordinary global overwrite while links inside host directories remain rejected

  @P1
  Scenario: A source inside the installed Skill can be synchronized safely
    Given a complete installed Skill is also selected as its own source
    When it is installed repeatedly
    Then the complete bundle is preserved, each run succeeds and no recursive staging copies remain
