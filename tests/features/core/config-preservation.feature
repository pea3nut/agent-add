Feature: Library-backed shared configuration edits retain user content

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
    And leading comments on retained fields and comments on unrelated settings and server sections survive
    And comments attached or adjacent to removed fields or array members follow library rules and may be removed

  @P0
  Scenario: TOML source editing handles inline dotted quoted and array-table representations
    Given configurations use inline tables, dotted keys, quoted names containing dots, multiline strings containing fake headers, and inline arrays of tables
    When existing MCPs are overwritten and new MCPs are added
    Then native decoded values match the sources while unrelated values and comments are retained
    When a Vibe file has duplicate same-name array tables with nested subtables
    Then default mode refuses the duplicate without writing and --overwrite replaces them with one server while preserving other servers and their comments

  @P0
  Scenario: Forced JSONC MCP edits retain comments inside the installed entry
    Given GitHub Copilot, opencode and Kilo configurations contain comments inside the selected MCP object, nested objects and argument arrays, plus unrelated settings
    When identical sources are installed with --overwrite
    Then each result is overwritten, modification times change, and the whole source text stays exact
    When source fields change or disappear
    Then decoded native values match the source and leading comments on retained fields and comments on unrelated settings remain
    And removing a field or array member may remove adjacent comments according to the editing library

  @P0
  Scenario: Library document APIs retain user comments and values during Prompt registration
    Given Kilo JSONC instructions and Aider YAML read lists contain user entries and comments with custom spacing and line endings
    When a Prompt is installed and registered
    Then the new path is registered exactly once and existing comments, entries and unrelated configuration values remain
    And YAML formatting follows the library's serializer rather than a custom source editor
    And repeating with --overwrite rewrites the Prompt but leaves the already-correct registration file untouched
    And scalar, block and flow YAML registration forms and commented empty documents remain valid

  @P0
  Scenario: Source-preserving edits refuse malformed ambiguous or unsafe shared configuration
    Given existing TOML and JSONC contain duplicate or malformed keys, and an Aider read anchor is referenced by another setting
    When an MCP overwrite or Prompt registration is attempted
    Then the CLI reports an error and preserves the original configuration exactly
    And no Prompt or partial configuration is written when registration would alter an unrelated alias value

  @P0
  Scenario: Aider Prompt registration preserves integers beyond JavaScript safe integer precision
    Given YAML contains positive and negative integers beyond Number.MAX_SAFE_INTEGER and 64-bit limits in root settings, nested mappings, sequences and anchors
    And read uses scalar, sequence, flow or empty registration syntax with user comments
    When a Prompt is installed and registered
    Then every unrelated integer retains its exact mathematical value when parsed with intAsBigInt
    And existing paths and comments survive and CONVENTIONS.md is registered exactly once
    And default reinstall leaves files untouched while --overwrite refreshes only the Prompt

  @P0
  Scenario: Precise YAML validation still refuses alias side effects before writing
    Given YAML contains arbitrary-size integers and a read sequence referenced by an unrelated alias
    When a Prompt registration would mutate the shared sequence
    Then the CLI fails and preserves the original YAML and Prompt bytes and modification times
    And independent registration through an alias retains unrelated values and exact integers

  @P0
  Scenario: TOML MCP overwrite preserves requested string line endings independently of document line endings
    Given Codex tables and Vibe array tables use LF or CRLF with existing literal or basic strings and user comments
    And unrelated multiline strings and safe-integer boundary settings are present
    When --overwrite installs changed arguments and environment values containing LF, CRLF, bare CR or leading and trailing newlines
    Then native parsed values exactly match the requested strings and every unrelated value remains unchanged
    And retained-field and unrelated comments survive without normalizing the document line endings
    And default differing installs still conflict without writing and identical forced installs refresh exact source bytes
    And later structural environment edits preserve the already-installed mixed-newline strings

  @P0
  Scenario: New multiline TOML fields and duplicate Vibe entries use safe library editing
    Given TOML has missing namespaces, inline containers or duplicate same-name Vibe servers with literal strings
    When a multiline MCP is added or forced over duplicate entries
    Then decoded new strings retain their exact line endings and duplicate entries become one requested server
    And unrelated servers, multiline values and comments remain intact

  @P0
  Scenario: Annotated TOML arrays support shorter strings and structural member changes
    Given Codex and Vibe configurations have argument arrays with several existing members and trailing member comments
    When --overwrite changes string widths and adds, removes or empties array members
    Then every requested argument survives native decoding and unrelated configuration values and field comments remain intact
    And an array that needs rebuilding uses the library's documented deletion rules for member comments
    And repeating the identical force writes the exact resulting source again

  @P0
  Scenario: TOML string editing rejects invalid output encoding before writing
    Given Codex and Vibe contain valid installed MCPs
    When --overwrite requests an unpaired UTF-16 surrogate in an existing string or a new field
    Then the CLI fails before writing and preserves the original target bytes and modification times
    And valid paired Unicode and control-character escapes still install correctly
