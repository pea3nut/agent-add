Feature: Forced overwrite with protected defaults

  Background:
    Given the CLI is built and each scenario uses isolated project, HOME and TMPDIR directories

  @P0
  Scenario: Default identical installs remain untouched while overwrite forces all five assets to be rewritten
    Given complete MCP, Skill, managed Prompt, Command and Sub-agent sources are installed on cursor
    And the installed bytes and modification times are recorded
    When the identical five sources are installed with no overwrite option
    Then the run exits 0, reports 5 exists and preserves every installed byte and modification time
    When the same sources are installed with --overwrite after setting target modification times to a known past value
    Then the run exits 0, reports 5 overwritten and 0 exists, and every target modification time changes
    And final content is unchanged with no duplicate MCP entries or Prompt blocks

  @P0
  Scenario: Claude Code forces all six identical assets in the combined README invocation
    Given two MCPs, a complete Skill, a managed Prompt, a Command and a Sub-agent are installed on claude-code
    And all installed files have a known past modification time
    When the identical six sources are reinstalled together with --overwrite as the last CLI argument
    Then all six items report overwritten, the summary has 6 overwritten and 0 exists, and every target is actually rewritten
    And parsed MCP entries and full installed files match the source fixtures while unrelated configuration and user Prompt text are preserved

  @P0
  Scenario: Forced Skill refresh does not read installed file contents for comparison
    Given an unprivileged user has a readable source Skill and an identical installed Skill whose helper file is unreadable
    When that user installs the Skill with --overwrite
    Then the run succeeds as overwritten, publishes a complete readable copy, and leaves no staging directory

  @P0
  Scenario: Different assets are protected by default and replaced only with overwrite
    Given all five asset types are installed on cursor and all five source contents then change
    When the changed sources are installed without --overwrite
    Then MCP, Command and Sub-agent report conflict without changing their destinations
    And Skill reports skipped with its reason and remains unchanged
    And the managed Prompt reports updated for only its own block and the overall CLI exits 1
    When the same invocation is run with --overwrite
    Then all final managed contents match the changed sources and the CLI exits 0
    And a further identical --overwrite run reports overwritten and rewrites the targets while preserving final content

  @P0
  Scenario: Skill comparison includes supporting resources empty directories and binary content
    Given a complete installed Skill has an identical SKILL.md but a changed binary helper or extra empty directory
    When it is reinstalled without --overwrite
    Then it reports skipped and the complete installed tree is unchanged
    When it is reinstalled with --overwrite
    Then it reports overwritten and the full source tree is installed with no stale target-only entry
    And the next identical default run reports exists and preserves bytes and modification times, while --overwrite reports overwritten and rewrites the bundle

  @P0
  Scenario: Incomplete Skill directories are not silently called identical
    Given a source Skill has SKILL.md and nested helpers
    And separate targets contain only SKILL.md, only an old helper, or an empty directory
    When each is installed without --overwrite
    Then the two nonempty incomplete targets report skipped and preserve their contents
    And the empty target is safely installed as written
    When the two nonempty incomplete targets are installed with --overwrite
    Then each reports overwritten and matches the complete source bundle

  @P0
  Scenario: A failed explicit Skill overwrite preserves the previous bundle and can be retried
    Given an old complete Skill and a changed source with an unreadable file copied after SKILL.md
    When the changed Skill is installed with --overwrite as an unprivileged user
    Then the CLI fails, the entire previous target is unchanged and no staging directory remains
    When the source permissions are repaired and the invocation is repeated
    Then the CLI reports overwritten and installs the entire new bundle
    And a further identical --overwrite run reports overwritten

  @P0
  Scenario: Publication failure during overwrite restores the previous Skill bundle
    Given a complete old Skill and complete changed source
    When publishSkill is called with a controlled rename fault after the old target moves to backup
    Then the old bundle is restored exactly and the error is surfaced
    And a fresh --overwrite invocation after removing the fault converges to the new source

  @P0
  Scenario: Same-name batch collisions block default writes while overwrite has deterministic precedence
    Given two ordered Packs and repeated explicit flags contain different same-name assets of all five types
    When the combined invocation runs without --overwrite
    Then non-Skill collisions are reported and no asset is written
    When it runs with --overwrite
    Then the last explicit source for each type wins and the CLI succeeds
    And without explicit flags the last Pack source wins
    And repeating the same ordered invocation produces the same final bytes without duplicate entries or marker blocks

  @P0
  Scenario: Native MCP semantic equality avoids default writes but cannot suppress a forced overwrite
    Given JSON, JSONC, Codex table TOML and Vibe array TOML configs with unrelated settings and same-name MCP entries
    When sources have reordered object keys but equivalent native values
    Then default mode reports exists and preserves configuration bytes and modification times
    And --overwrite reports overwritten, changes each target modification time, and preserves decoded entries and unrelated settings
    When sources change argument order, environment values or remote settings
    Then default mode reports conflict and preserves bytes
    And --overwrite replaces only the named entry, preserves unrelated values and produces no duplicate entries
    And a further identical --overwrite run reports overwritten

  @P0
  Scenario: Standalone Prompt protection and managed Prompt updates keep separate scopes
    Given an installed standalone Roo rule and a managed Cursor prompt with user text and an independent block
    When their sources change without --overwrite
    Then the standalone rule reports conflict and stays unchanged while the managed block reports updated
    When --overwrite is supplied
    Then the standalone rule is replaced and user text and the independent managed block remain exact
    And repeated identical default inputs report exists while --overwrite reports overwritten and rewrites both targets
    And malformed or duplicate markers still fail without writes even with --overwrite

  @P0
  Scenario: Native serialization precedes command and sub-agent content comparison
    Given Gemini commands and Cursor sub-agents have been installed
    When only ignored command frontmatter fields or other-host sub-agent hints change
    Then final generated content remains equal and default mode reports exists without writes
    And --overwrite reports overwritten and rewrites the generated files even though their native content is unchanged
    When native description, active-host model or body changes
    Then default mode reports conflict and --overwrite installs the changed native content
    And the subsequent identical default run reports exists while --overwrite reports overwritten

  @P0
  Scenario: Overwrite does not bypass malformed source configuration or path protection
    Given existing target snapshots and batches with a valid source plus an invalid MCP or native command
    When each batch runs in either mode
    Then source validation fails before any destination is written
    And malformed existing JSON, JSONC or TOML fails without replacement in either mode
    And target links, parent links and source links in Skills remain rejected with --overwrite
    And a Skill destination nested inside its source remains rejected without recursion or external writes

  @P0
  Scenario: Unsupported Pack assets remain skipped without resolution while explicit unsupported flags fail
    Given a Pack contains unsupported missing sources plus a supported complete Skill
    When it is installed on cursor with --global in either mode
    Then unsupported entries report skipped without attempting to resolve missing sources and the supported Skill installs, reports exists only in default mode, or reports overwritten with --overwrite
    When an unsupported asset is requested explicitly with --overwrite
    Then the CLI exits 2 and neither supported nor unsupported destinations are written

  @P1
  Scenario: Project and user targets remain independent in both modes
    Given project and user assets share names but contain different source content
    When only the user assets are changed with --overwrite
    Then all project bytes remain unchanged and only the selected user assets are updated
    And an identical user install without --overwrite reports exists

  @P1
  Scenario: Summary counts distinguish writes existing content skips conflicts and errors
    Given batches producing written, overwritten, updated, exists, skipped, conflict and error outcomes
    When the corresponding invocations run with the appropriate overwrite options
    Then every summary count matches the per-asset outcomes and exists is never counted as written
    And conflicts or errors yield a nonzero exit code, while exists and skipped alone do not
