Feature: Documented host hints use the current agent-add namespace

  @P0
  Scenario: Every translated model example works when copied verbatim
    Given the host-specialization YAML examples are extracted from README.md, docs/README.zh-CN.md and docs/README.ja.md using a Markdown parser or line-state parser
    And each example is saved verbatim as a sub-agent in a fresh isolated project
    When each example is installed on cursor and claude-code
    Then all six installations succeed
    And parsed Cursor metadata has model fast and Claude Code metadata has model haiku
    And no agent-add override keys remain in either generated file
    And the source examples contain no agent-get namespace
