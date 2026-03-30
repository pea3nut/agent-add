Feature: CLI basic commands

  @P0
  Scenario: --version outputs the correct version number
    Given a temp working directory is created
    When the user runs node /e/_pea3nut/projects/agent-get/bin/agent-get.js --version
    Then the output matches the pattern \d+\.\d+\.\d+

  @P0
  Scenario: --help outputs help information
    Given a temp working directory is created
    When the user runs node /e/_pea3nut/projects/agent-get/bin/agent-get.js --help
    Then the output contains "Usage:"
