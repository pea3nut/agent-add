Feature: Native host contracts and audit regressions

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  # Each exercise uses the built CLI and parses generated artifacts, retaining
  # original config text to check comments, failed writes and idempotency.

  @P0
  Scenario: Zed uses native context_servers and its highest-priority instruction file
    Given a temp working directory is created
    When the native Zed contracts are exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" zed "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: Cline honors the CLI path override and converts streamable HTTP
    Given a temp working directory is created
    When the Cline contracts are exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" cline "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: Continue discovers a compatible MCP file and project rules
    Given a temp working directory is created
    When the Continue contracts are exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" continue "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: Aider registers conventions without losing scalar read entries or YAML comments
    Given a temp working directory is created
    When the Aider contracts are exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" aider "$SETUP_TMPDIR"
    Then the exit code is 0

  @P1
  Scenario: Invalid Aider read registration does not leave an unloaded conventions file
    Given a temp working directory is created
    When invalid Aider configuration is exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" aider-invalid "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: Goose merges YAML extensions and respects the context filename override
    Given a temp working directory is created
    When the Goose contracts are exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" goose "$SETUP_TMPDIR"
    Then the exit code is 0

  @P1
  Scenario: Goose rejects SSE without relabeling it or modifying configuration
    Given a temp working directory is created
    When unsupported Goose transport is exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" goose-sse "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: Amp keeps its literal amp.mcpServers key and existing JSONC file
    Given a temp working directory is created
    When the Amp contracts are exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" amp "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: F02 opencode converts local and remote MCP into native JSONC schema
    Given a temp working directory is created
    When the opencode contracts are exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" opencode "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: Kilo converts MCP and registers rules in instructions exactly once
    Given a temp working directory is created
    When the Kilo contracts are exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" kilo "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: F01 Codex subagents decode as native TOML rather than renamed Markdown
    Given a temp working directory is created
    When Codex subagent conversion is exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" codex-agent "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: F03 Vibe retains MCP environment and writes native subagent TOML
    Given a temp working directory is created
    When the Vibe contracts are exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" vibe "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: F04 host hints override generic fields in either order with BOM and CRLF
    Given a temp working directory is created
    When frontmatter precedence is exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" host-hints "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: F05 Codex preserves HTTP URL and maps request headers
    Given a temp working directory is created
    When Codex HTTP conversion is exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" codex-http "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: F06 JSON key order is immaterial but argument order still conflicts
    Given a temp working directory is created
    When semantic MCP comparison is exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" key-order "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: F07 a changed standalone Roo rule reports conflict without losing content
    Given a temp working directory is created
    When standalone rule lifecycle is exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" roo-prompt "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: F08 same-name prompts block every write in the batch
    Given a temp working directory is created
    When same-name source collisions are exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" prompt-collision "$SETUP_TMPDIR"
    Then the exit code is 0

  @P1
  Scenario: Malformed prompt markers fail safely and prefix names remain independent
    Given a temp working directory is created
    When prompt marker safety is exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" markers "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: OpenClaw preserves JSON5 and selects the configured agent workspace
    Given a temp working directory is created
    When the OpenClaw contracts are exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" openclaw "$SETUP_TMPDIR"
    Then the exit code is 0

  @P1
  Scenario: Gemini honors the configured context filename
    Given a temp working directory is created
    When Gemini context discovery is exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" gemini-context "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: Reserved MCP server names fail before any configuration or prompt writes
    Given a temp working directory is created
    When reserved names are exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" reserved-names "$SETUP_TMPDIR"
    Then the exit code is 0

  @P0
  Scenario: Claude Code remote MCP entries normalize HTTP and retain explicit SSE
    Given a temp working directory is created
    When Claude remote transports are exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" claude-remote "$SETUP_TMPDIR"
    Then the exit code is 0

  @P1
  Scenario: Shared prompt and MCP symlinks preserve their referents and report dangling targets
    Given a temp working directory is created
    When symlinked targets are exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" symlink-targets "$SETUP_TMPDIR"
    Then the exit code is 0

  @P1
  Scenario: Invalid JSON, YAML, TOML and nested MCP structures are never overwritten
    Given a temp working directory is created
    When malformed host configuration is exercised: node "$PROJECT_ROOT/tests/features/exercise-contract.cjs" invalid-config "$SETUP_TMPDIR"
    Then the exit code is 0
