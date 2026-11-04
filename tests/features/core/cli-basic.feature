Feature: CLI basic commands

  Background:
    Given the project root is detected: PROJECT_ROOT=$(git rev-parse --show-toplevel)

  @P0
  Scenario: --version outputs the correct version number
    Given a temp working directory is created
    When the user runs node "$PROJECT_ROOT/bin/agent-add.js" --version
    Then the output matches the pattern \d+\.\d+\.\d+

  @P0
  Scenario: --help outputs help information
    Given a temp working directory is created
    When the user runs node "$PROJECT_ROOT/bin/agent-add.js" --help
    Then the output contains "Usage:"

  @P0
  Scenario: No --host flag in non-TTY exits with error code 2
    Given a temp working directory is created
    And the MCP fixture is copied: cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"
    When the user runs without --host: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --mcp ./playwright.json > "$SETUP_TMPDIR/out.txt" 2>&1; echo $? > "$SETUP_TMPDIR/exitcode.txt"; true
    Then the exit code is 2: grep -q "^2$" "$SETUP_TMPDIR/exitcode.txt"
    And the output mentions non-interactive: grep -qi "non-interactive" "$SETUP_TMPDIR/out.txt"

  @P0
  Scenario: Queued assets and HTTP download progress are visible before installation completes
    Given an isolated project and HOME with a loopback HTTP server serving review.md in delayed chunks with a correct Content-Length
    And a second local command later.md is queued in the same invocation
    When the built CLI installs both commands on claude-code with stdout and stderr captured as separate live streams
    Then both command/review and command/later are reported as pending before the HTTP response finishes
    And downloading and an intermediate percentage and byte count arrive while the response is still incomplete
    And neither command is written before all sources have been resolved and validated
    When the server releases the remaining bytes
    Then the CLI exits with code 0 and reports each command as written before the final Install Summary
    And both installed commands match their source contents
    And the captured progress contains no ANSI escapes or carriage returns

  @P1
  Scenario: HTTP downloads without a usable length show bytes instead of a fabricated percentage
    Given an isolated project and a slow loopback HTTP server serving review.md without Content-Length
    When the CLI installs the command on claude-code with piped stdout
    Then downloading and increasing byte counts are visible before the response completes, without percentages
    And the final received byte count is printed even when the last chunk arrives within the log throttle interval
    And the CLI exits with code 0 and the installed command matches the response body

  @P1
  Scenario: A real terminal refreshes download progress and keeps animating while the server is idle
    Given an isolated project and a loopback HTTP server that pauses review.md before headers and between body chunks
    When the built CLI installs the command on claude-code inside a real pseudo-terminal
    Then the active downloading line refreshes in place during both pauses, without adding new lines for animation frames
    And the known-length response shows a progress bar with an intermediate percentage
    And the progress line is cleared before the written result and final summary
    And the process exits normally without a leftover animation timer

  @P1
  Scenario: Remote manifests use the same live download progress as their assets
    Given an isolated project and a loopback HTTP server serving a delayed manifest and delayed review.md command
    When the CLI installs the remote pack on claude-code
    Then pack download progress is visible before the manifest response finishes
    And after parsing the manifest the command is reported as pending and then downloading
    And the CLI exits with code 0 and the installed command matches the source response

  @P1
  Scenario: A failed streaming download cleans partial files and leaves queued assets unwritten
    Given an isolated project, HOME and TMPDIR and a slow loopback HTTP server that disconnects halfway through review.md
    And a local command later.md is queued after the HTTP source
    When the CLI installs both commands on claude-code in a real pseudo-terminal
    Then download progress is visible before the disconnection
    And the progress line is cleared and an error is printed with exit code 2
    And neither command is installed and no agent-add HTTP temporary directory remains

  @P1
  Scenario: Git sources report fetch and checkout before per-asset installation
    Given an isolated local bare Git fixture containing a command, routed from an HTTPS Git source through a private Git URL rewrite
    When the CLI installs that command on claude-code without using the network
    Then live output reports pending, downloading, checking out, installing and written in that order
    And the installed command matches the selected Git revision
    And Git progress does not pollute stderr on success
