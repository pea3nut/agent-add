Feature: Shared configuration edits preserve user source text

  Background:
    Given the CLI is built and every scenario isolates its project, HOME and TMPDIR

  @P0
  Scenario: Identical forced TOML MCP refresh preserves comments and formatting while actually writing
    Given Codex table TOML and Vibe array TOML contain an identical installed MCP with user and server comments, literal quotes, CRLF and no final newline
    When each MCP is installed with --overwrite
    Then each item reports overwritten and the modification time changes
    And the complete configuration is byte-for-byte identical, including all comments and formatting
    And default reinstall still reports exists without writing

  @P0
  Scenario: Changed TOML MCP fields preserve comments and unrelated sections
    Given Codex and Vibe configurations contain a server, a nested environment table, an annotated argument array and an unrelated server and settings
    When --overwrite changes arguments and environment values and removes obsolete fields
    Then decoded configuration exactly matches the requested server with no stale fields
    And all original comments survive, including comments on removed fields and arguments
    And unrelated settings and server sections retain their exact source text

  @P0
  Scenario: TOML source editing handles inline dotted quoted and array-table representations
    Given configurations use inline tables, dotted keys, quoted names containing dots, multiline strings containing fake headers, and inline arrays of tables
    When existing MCPs are overwritten and new MCPs are added
    Then native decoded values match the sources while existing unrelated syntax and comments are retained
    When a Vibe file has duplicate same-name array tables with nested subtables
    Then default mode refuses the duplicate without writing and --overwrite replaces them with one server while preserving other servers and comments

  @P0
  Scenario: Forced JSONC MCP edits retain comments inside the installed entry
    Given GitHub Copilot, opencode and Kilo configurations contain comments inside the selected MCP object, nested objects and argument arrays, plus unrelated settings
    When identical sources are installed with --overwrite
    Then each result is overwritten, modification times change, and the whole source text stays exact
    When source fields change or disappear
    Then decoded native values match the source and all comments and unrelated source text remain

  @P0
  Scenario: Prompt registration patches only its JSONC or YAML property
    Given Kilo JSONC instructions and Aider YAML read lists contain user entries and comments with custom spacing and line endings
    When a Prompt is installed and registered
    Then the new path is registered exactly once, existing comments and entries remain, and unrelated source text is byte-for-byte unchanged
    And repeating with --overwrite rewrites the Prompt but leaves the already-correct registration file untouched
    And scalar, block and flow YAML registration forms and commented empty documents remain valid

  @P0
  Scenario: Source-preserving edits refuse malformed ambiguous or unsafe shared configuration
    Given existing TOML and JSONC contain duplicate or malformed keys, and an Aider read anchor is referenced by another setting
    When an MCP overwrite or Prompt registration is attempted
    Then the CLI reports an error and preserves the original configuration exactly
    And no Prompt or partial configuration is written when registration would alter an unrelated alias value
