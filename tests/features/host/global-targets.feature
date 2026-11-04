Feature: Verified user targets for every registered host

  Background:
    Given a separate temporary project and user home with all host root overrides cleared
    And the existing MCP, prompt, skill, command and sub-agent fixtures are available from the invocation directory

  @P0
  Scenario: cursor installs all selected user assets using native formats
    When MCP, Skill, Sub-agent are installed together with --global --host cursor
    Then only these user-home targets are written: .cursor/mcp.json → mcpServers; .cursor/skills/; .cursor/agents/
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: claude-code installs all selected user assets using native formats
    When MCP, Prompt, Skill, Command, Sub-agent are installed together with --global --host claude-code
    Then only these user-home targets are written: .claude.json → mcpServers; .claude/CLAUDE.md; .claude/skills/; .claude/commands/; .claude/agents/
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: github-copilot installs all selected user assets using native formats
    When Skill, Sub-agent are installed together with --global --host github-copilot
    Then only these user-home targets are written: .copilot/skills/; .copilot/agents/*.agent.md
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: gemini installs all selected user assets using native formats
    When MCP, Prompt, Skill, Command, Sub-agent are installed together with --global --host gemini
    Then only these user-home targets are written: .gemini/settings.json → mcpServers; .gemini/GEMINI.md; .gemini/skills/; .gemini/commands/*.toml; .gemini/agents/
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: kilo-code installs all selected user assets using native formats
    When MCP, Skill, Command, Sub-agent are installed together with --global --host kilo-code
    Then only these user-home targets are written: .config/kilo/kilo.jsonc → mcp; .kilo/skills/; .config/kilo/commands/; .config/kilo/agents/
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: qwen-code installs all selected user assets using native formats
    When MCP, Skill, Command, Sub-agent are installed together with --global --host qwen-code
    Then only these user-home targets are written: .qwen/settings.json → mcpServers; .qwen/skills/; .qwen/commands/*.md; .qwen/agents/*.md
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: opencode installs all selected user assets using native formats
    When MCP, Prompt, Skill, Command, Sub-agent are installed together with --global --host opencode
    Then only these user-home targets are written: .config/opencode/opencode.json → mcp; .config/opencode/AGENTS.md; .config/opencode/skills/; .config/opencode/commands/; .config/opencode/agents/
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: augment installs all selected user assets using native formats
    When MCP, Prompt, Skill, Command, Sub-agent are installed together with --global --host augment
    Then only these user-home targets are written: .augment/settings.json → mcpServers; .augment/rules/; .augment/skills/; .augment/commands/; .augment/agents/
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: windsurf installs all selected user assets using native formats
    When Command are installed together with --global --host windsurf
    Then only these user-home targets are written: .codeium/windsurf/global_workflows/*.md (legacy Cascade only)
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: roo-code installs all selected user assets using native formats
    When Prompt, Skill, Command are installed together with --global --host roo-code
    Then only these user-home targets are written: .roo/rules/; .roo/skills/; .roo/commands/
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: kiro installs all selected user assets using native formats
    When MCP, Prompt, Skill, Sub-agent are installed together with --global --host kiro
    Then only these user-home targets are written: .kiro/settings/mcp.json → mcpServers; .kiro/steering/; .kiro/skills/; .kiro/agents/*.md (V3 / IDE 1.0)
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: codex installs all selected user assets using native formats
    When MCP, Prompt, Skill, Sub-agent are installed together with --global --host codex
    Then only these user-home targets are written: .codex/config.toml → mcp_servers; .codex/AGENTS.md; .agents/skills/; .codex/agents/*.toml
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: tabnine installs all selected user assets using native formats
    When MCP, Command are installed together with --global --host tabnine
    Then only these user-home targets are written: .tabnine/mcp_servers.json → mcpServers (IDE Agent); .tabnine/agent/commands/*.toml (CLI)
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: kimi installs all selected user assets using native formats
    When MCP, Skill are installed together with --global --host kimi
    Then only these user-home targets are written: .kimi/mcp.json → mcpServers; .kimi/skills/
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: trae installs all selected user assets using native formats
    When Skill are installed together with --global --host trae
    Then only these user-home targets are written: .trae/skills/
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: openclaw installs all selected user assets using native formats
    When Skill are installed together with --global --host openclaw
    Then only these user-home targets are written: .openclaw/skills/
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: vibe installs all selected user assets using native formats
    When MCP, Prompt, Skill, Sub-agent are installed together with --global --host vibe
    Then only these user-home targets are written: .vibe/config.toml → mcp_servers array; .vibe/AGENTS.md; .vibe/skills/; .vibe/agents/*.toml with inline instructions
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: cline installs all selected user assets using native formats
    When MCP, Prompt, Skill are installed together with --global --host cline
    Then only these user-home targets are written: .cline/data/settings/cline_mcp_settings.json → mcpServers (CLI); .cline/rules/; .cline/skills/
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: amp installs all selected user assets using native formats
    When MCP, Prompt, Skill are installed together with --global --host amp
    Then only these user-home targets are written: .config/amp/settings.json → literal amp.mcpServers; .config/amp/AGENTS.md; .config/amp/skills/
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: zed installs all selected user assets using native formats
    When Prompt, Skill are installed together with --global --host zed
    Then only these user-home targets are written: .config/zed/AGENTS.md; .agents/skills/ (macOS/Linux instruction path)
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: goose installs all selected user assets using native formats
    When Prompt, Skill are installed together with --global --host goose
    Then only these user-home targets are written: .config/goose/.goosehints; .agents/skills/ (macOS/Linux hints path)
    And decoded MCP settings and native TOML or Markdown metadata match the source fixtures rather than merely existing
    And the complete skill bundle is preserved when supported, including supporting resources
    And reinstalling the same sources reports exists without modifying target bytes or any project file

  @P0
  Scenario: Claude Desktop user MCP respects the native platform boundary
    When user MCP is requested on the current platform
    Then macOS selects Library/Application Support/Claude/claude_desktop_config.json under home, Windows selects APPDATA/Claude/claude_desktop_config.json, and Linux fails explicitly without writing
    And the selected file supports local stdio only; remote MCP is rejected without modifying it
    And macOS and Windows path selection can be unit-tested on Linux but is not reported as native OS execution

  @P0
  Scenario: continue does not inherit project capability as a guessed user contract
    When each asset type is requested explicitly with --global --host continue
    Then each request fails with code 2 and a user-level unsupported reason before writing any destination
    And project installations are still independently available according to the host reference

  @P0
  Scenario: aider does not inherit project capability as a guessed user contract
    When each asset type is requested explicitly with --global --host aider
    Then each request fails with code 2 and a user-level unsupported reason before writing any destination
    And project installations are still independently available according to the host reference
