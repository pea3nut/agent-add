Feature: Inline source names cannot escape temporary storage

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)
    And a temp working directory and isolated HOME and TMPDIR are created

  @P0
  Scenario: A traversal-shaped inline MCP name cannot overwrite a neighboring file
    Given TMPDIR/victim.json contains the exact bytes KEEP
    When the built CLI installs --host cursor --mcp '{"../victim":{"command":"node","args":["server.js"]}}'
    Then the exit code is 0
    And TMPDIR/victim.json still contains exactly KEEP
    And decoded .cursor/mcp.json contains the literal server key ../victim with the supplied command and arguments
    And TMPDIR contains only victim.json after temporary source cleanup

  @P0
  Scenario: Wrapped names and Windows separators stay logical names rather than paths
    Given sentinel files victim.json and other.json outside generated temporary subdirectories contain KEEP
    When inline mcpServers-wrapped names ../victim and ..\other are installed in separate invocations
    Then neither sentinel is changed and neither invocation writes outside its temporary subdirectory
    And both literal server names retain their supplied settings in the decoded target
    And no agent-add-inline temporary directories remain

  @P1
  Scenario: A later invalid source cleans an inline source without touching neighboring files
    Given TMPDIR/victim.json contains KEEP
    When the CLI installs the traversal-shaped inline MCP and a missing local MCP source in one invocation
    Then the exit code is 2 and no host configuration exists
    And the sentinel is unchanged and no agent-add-inline temporary directory remains
