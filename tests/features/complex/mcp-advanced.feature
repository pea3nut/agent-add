Feature: MCP advanced installation scenarios

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: MCP with env variables preserves env in JSON output
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright-with-env.json" "$SETUP_TMPDIR/playwright-with-env.json"
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright-with-env.json
    Then the exit code is 0
    And the env BROWSER key exists: grep -q '"BROWSER"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the env BROWSER value is correct: grep -q '"chromium"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the env HEADLESS key exists: grep -q '"HEADLESS"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the env HEADLESS value is correct: grep -q '"true"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P0
  Scenario: MCP install into pre-existing config preserves existing entries
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    And a pre-existing mcp.json exists: printf '{"mcpServers":{"existing-tool":{"command":"echo","args":["hello"]}}}' > "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp ./playwright.json
    Then the exit code is 0
    And the existing entry is preserved: grep -q '"existing-tool"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the existing command is preserved: grep -q '"echo"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And the new MCP is added: grep -q '"playwright"' "$SETUP_TMPDIR/.cursor/mcp.json"

  @P1
  Scenario: Two sequential MCP installs coexist in same config on Claude Code
    Given a temp working directory is created
    And MCP fixtures are copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json" && cp "$PROJECT_ROOT/tests/fixtures/mcp/filesystem.json" "$SETUP_TMPDIR/filesystem.json"
    And a .claude directory exists: mkdir -p "$SETUP_TMPDIR/.claude"
    And first MCP is installed: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --mcp ./playwright.json
    When the user installs second MCP: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --mcp ./filesystem.json
    Then the exit code is 0
    And both MCPs coexist: grep -q '"playwright"' "$SETUP_TMPDIR/.mcp.json" && grep -q '"filesystem"' "$SETUP_TMPDIR/.mcp.json"

  @P1
  Scenario: Codex MCP install produces TOML table format
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    And the codex config directory exists: mkdir -p "$SETUP_TMPDIR/.codex"
    When the user runs: cd "$SETUP_TMPDIR" && AGENT_ADD_HOME="$SETUP_TMPDIR" node "$PROJECT_ROOT/bin/agent-add.js" --host codex --mcp ./playwright.json
    Then the exit code is 0
    And the TOML config exists: test -f "$SETUP_TMPDIR/.codex/config.toml"
    And the decoded mcp_servers.playwright matches the fixture's command and args
    When a remote HTTP MCP with request headers is also installed
    Then its decoded TOML entry preserves the URL and maps headers to http_headers without a stdio command

  @P1
  Scenario: Codex TOML preserves env variables
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright-with-env.json" "$SETUP_TMPDIR/playwright-with-env.json"
    And the codex config directory exists: mkdir -p "$SETUP_TMPDIR/.codex"
    When the user runs: cd "$SETUP_TMPDIR" && AGENT_ADD_HOME="$SETUP_TMPDIR" node "$PROJECT_ROOT/bin/agent-add.js" --host codex --mcp ./playwright-with-env.json
    Then the exit code is 0
    And the TOML config exists: test -f "$SETUP_TMPDIR/.codex/config.toml"
    And the decoded TOML environment exactly matches the fixture's string values

  @P0
  Scenario: Inline JSON MCP install on Cursor succeeds (cross-drive atomic write regression)
    Given a temp working directory is created
    And a .cursor directory exists: mkdir -p "$SETUP_TMPDIR/.cursor"
    When the user runs: cd "$SETUP_TMPDIR" && MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' node "$PROJECT_ROOT/bin/agent-add.js" --host cursor --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}'
    Then the exit code is 0
    And the config file exists: test -f "$SETUP_TMPDIR/.cursor/mcp.json"
    And the MCP key exists: grep -q '"playwright"' "$SETUP_TMPDIR/.cursor/mcp.json"
    And no temp files remain: test $(ls "$SETUP_TMPDIR/.cursor/" | grep -c '\.tmp$') -eq 0

  @P2
  Scenario: Vibe MCP install produces TOML array format
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright-with-env.json" "$SETUP_TMPDIR/playwright.json"
    And a .vibe directory exists: mkdir -p "$SETUP_TMPDIR/.vibe"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host vibe --mcp ./playwright.json
    Then the exit code is 0
    And the TOML config exists: test -f "$SETUP_TMPDIR/.vibe/config.toml"
    And mcp_servers decodes as an array whose playwright entry preserves command, args and env with stdio transport
    When a remote URL source is attempted on Vibe
    Then it fails without modifying the installed configuration or silently dropping the URL

  @P0
  Scenario: Reject malformed TOML ending in an array comment without hanging
    Given a temp working directory is created
    And an isolated home is configured: export HOME="$SETUP_TMPDIR/home" AGENT_ADD_HOME="$SETUP_TMPDIR/home" && mkdir -p "$HOME/.codex"
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    And the existing TOML ends in a comment without a newline: printf '%s' 'a=[1 #' > "$HOME/.codex/config.toml"
    And the original config is saved: cp "$HOME/.codex/config.toml" "$SETUP_TMPDIR/before.toml"
    When the user runs with a five-second process timeout: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host codex --mcp ./playwright.json > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the CLI finishes within five seconds rather than timing out
    And the recorded CLI exit code is 1: test "$(cat "$SETUP_TMPDIR/exitcode.txt")" -eq 1
    And the output reports a TOML parsing error: grep -q 'Failed to parse TOML config file' "$SETUP_TMPDIR/out.txt"
    And the existing config is byte-for-byte unchanged: cmp "$HOME/.codex/config.toml" "$SETUP_TMPDIR/before.toml"

  @P0
  Scenario: Native MCP adapters preserve portable source semantics and existing settings
    Given isolated homes with existing settings and portable stdio and HTTP fixtures
    When the fixtures are installed on Zed, Cline, Continue, Goose, Amp, opencode and Kilo
    Then decoded settings match each host's documented native schema, retaining commands, arguments, environments, URLs and headers where supported
    And Cline honors CLINE_MCP_SETTINGS_PATH, Amp preserves its literal amp.mcpServers key and JSONC comments, and existing unrelated entries remain unchanged
    And reinstalling identical entries reports exists without modifying configuration

  @P0
  Scenario: Gemini and Qwen distinguish native HTTP from SSE while Claude normalizes remote types
    Given isolated hosts and native httpUrl, URL-only, explicit HTTP alias and explicit SSE sources with headers
    When each source is installed on Gemini and Qwen
    Then decoded entries use httpUrl for HTTP and url for SSE, preserve headers and environment placeholders, and reinstall unchanged
    And flat servers named command, url, serverUrl, httpUrl, type and transport remain valid server maps
    And mixed endpoints, command plus URL, contradictory selectors and httpUrl plus SSE fail without changing files
    And Claude Code writes type http for URL-only sources and type sse for explicit SSE sources

  @P0
  Scenario: Configuration edits compare semantics and reject ambiguous or malformed input
    Given existing JSON, JSONC, JSON5, YAML and TOML configurations with unrelated entries and comments
    When an MCP is reinstalled with reordered object keys or reordered argument arrays
    Then object-key order reports exists while changed array order reports conflict
    And duplicate decoded keys in JSON, JSONC and JSON5, including nested objects and arrays, fail without modifying any target
    And repeated keys in separate objects remain valid
    And malformed syntax, non-object roots and invalid nested MCP containers are rejected without writes

  @P0
  Scenario: Goose validates optional native fields without changing their meaning
    Given isolated Goose configurations and HTTP and stdio MCP sources
    When enabled and timeout are omitted or explicitly set to false, zero, null or valid nonnegative safe integers
    Then decoded YAML preserves explicit values and otherwise defaults enabled to true and timeout to 300
    And non-boolean enabled, invalid timeout types, negative or fractional timeouts and unsafe integers fail without changing configuration
    And SSE sources fail rather than being relabeled as streamable HTTP

  @P0
  Scenario: Malformed remote URLs fail before any host configuration is written
    Given isolated installations for every host that supports MCP
    When sources contain missing hosts, whitespace, broken IPv6 authorities, invalid ports or non-HTTP schemes
    Then every affected installation fails and the entire target directory remains unchanged
    And URL structure is checked locally without probing an MCP server

  @P1
  Scenario: Configuration safety preserves special-name boundaries and symlink targets
    Given MCP servers named __proto__, constructor, prototype or << and an accompanying prompt
    When each invalid batch is installed
    Then it fails before writing any configuration or prompt
    When valid MCP and prompt targets are symlinks to existing files
    Then installation updates their referents, preserves the symlinks and existing permissions, and uses mode 0600 for new files
    And dangling or cyclic symlink targets fail without replacement
