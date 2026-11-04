Feature: User installation scope and project isolation

  Background:
    Given the project root is detected: export PROJECT_ROOT=$(git rev-parse --show-toplevel)
    And a temp working directory is created
    And the user home is isolated: export HOME="$SETUP_TMPDIR/home"; mkdir -p "$HOME" "$SETUP_TMPDIR/project"
    And native configuration overrides are cleared: unset CLAUDE_CONFIG_DIR GEMINI_CLI_HOME CODEX_HOME VIBE_HOME CLINE_DIR CLINE_DATA_DIR CLINE_MCP_SETTINGS_PATH OPENCLAW_STATE_DIR OPENCLAW_PROFILE OPENCLAW_HOME OPENCODE_CONFIG OPENCODE_CONFIG_DIR OPENCODE_CONFIG_CONTENT XDG_CONFIG_HOME COPILOT_HOME KIMI_SHARE_DIR
    And fixtures are copied: cp -r "$PROJECT_ROOT/tests/fixtures" "$SETUP_TMPDIR/fixtures"

  @P0
  Scenario: Global MCP installs outside a repository and preserves Claude user state
    Given unrelated user state exists: printf '{"theme":"dark","projects":{"keep":{"allowedTools":[]}}}' > "$HOME/.claude.json"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --global --host claude-code --mcp ./fixtures/mcp/playwright.json > out.txt
    Then the native user configuration is merged semantically: node -e 'const a=require("node:assert/strict"),fs=require("node:fs"),p=process.env.HOME+"/.claude.json",c=JSON.parse(fs.readFileSync(p));a.equal(c.theme,"dark");a.deepEqual(c.projects,{keep:{allowedTools:[]}});a.deepEqual(c.mcpServers.playwright,JSON.parse(fs.readFileSync("fixtures/mcp/playwright.json")));'
    And the result identifies user scope and destination: grep -F 'Scope: user (--global)' out.txt && grep -F "$HOME/.claude.json" out.txt
    And no project or invented user MCP file exists: test ! -e .mcp.json && test ! -e "$HOME/.claude/.mcp.json"

  @P0
  Scenario: Same-name MCP installations and conflicts stay in the selected scope
    When project and user installations run: cd "$SETUP_TMPDIR/project" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --mcp '{"same":{"command":"project"}}' && node "$PROJECT_ROOT/bin/agent-add.js" --global --host claude-code --mcp '{"same":{"command":"user"}}'
    Then both scopes retain their own semantic values: node -e 'const a=require("node:assert/strict"),fs=require("node:fs");a.equal(JSON.parse(fs.readFileSync(".mcp.json")).mcpServers.same.command,"project");a.equal(JSON.parse(fs.readFileSync(process.env.HOME+"/.claude.json")).mcpServers.same.command,"user");'
    When a changed user entry is requested: node "$PROJECT_ROOT/bin/agent-add.js" --global --host claude-code --mcp '{"same":{"command":"changed"}}' > "$SETUP_TMPDIR/out.txt" 2>&1; code=$?; test "$code" -eq 1
    Then neither scope changed: node -e 'const a=require("node:assert/strict"),fs=require("node:fs");a.equal(JSON.parse(fs.readFileSync(".mcp.json")).mcpServers.same.command,"project");a.equal(JSON.parse(fs.readFileSync(process.env.HOME+"/.claude.json")).mcpServers.same.command,"user");'

  @P0
  Scenario: Global pack and repeated extra flags resolve sources from invocation cwd
    Given a nested manifest uses cwd-relative sources: mkdir -p "$SETUP_TMPDIR/manifests"; printf '{"name":"test/global-pack","assets":[{"type":"mcp","source":"./fixtures/mcp/playwright.json"},{"type":"skill","source":"./fixtures/skill/my-skill"}]}' > "$SETUP_TMPDIR/manifests/pack.json"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --global --host claude-code --pack ./manifests/pack.json --prompt ./fixtures/prompt/my-prompt.md --command ./fixtures/command/my-command.md --command ./fixtures/command/my-command.md --sub-agent ./fixtures/sub-agent/my-agent.md
    Then every asset uses the user scope: test -f "$HOME/.claude.json" && test -f "$HOME/.claude/skills/my-skill/SKILL.md" && test -f "$HOME/.claude/CLAUDE.md" && test -f "$HOME/.claude/commands/my-command.md" && test -f "$HOME/.claude/agents/my-agent.md"
    And skill resources and command content are preserved: diff -r fixtures/skill/my-skill "$HOME/.claude/skills/my-skill" && cmp fixtures/command/my-command.md "$HOME/.claude/commands/my-command.md"
    And no project target was created: test ! -e .claude && test ! -e .mcp.json && test ! -e CLAUDE.md

  @P0
  Scenario: Explicit unsupported user asset blocks otherwise supported writes
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --global --host cursor --skill ./fixtures/skill/my-skill --prompt ./fixtures/prompt/my-prompt.md > out.txt 2>&1; code=$?; test "$code" -eq 2
    Then the error identifies the unavailable user contract: grep -F 'No verified user-level prompt' out.txt
    And neither scope has destinations: test ! -e "$HOME/.cursor" && test ! -e .cursor

  @P0
  Scenario: Unsupported pack-only user assets are skipped without resolving their sources
    Given unsupported pack sources do not exist: printf '{"name":"test/mixed","assets":[{"type":"prompt","source":"./missing.md"},{"type":"command","source":"./missing-command.md"},{"type":"skill","source":"./fixtures/skill/my-skill"}]}' > "$SETUP_TMPDIR/pack.json"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --global --host cursor --pack ./pack.json > out.txt
    Then supported assets install and the other two are skipped: test -f "$HOME/.cursor/skills/my-skill/SKILL.md" && grep -F '1 written · 2 skipped' out.txt
    And the project remains untouched: test ! -e .cursor

  @P0
  Scenario: Codex home relocation does not relocate user skills and respects prompt override
    Given the Codex home is overridden: export CODEX_HOME="$SETUP_TMPDIR/custom-codex"; mkdir -p "$CODEX_HOME"; printf 'Existing override\n' > "$CODEX_HOME/AGENTS.override.md"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --global --host codex --mcp ./fixtures/mcp/playwright.json --skill ./fixtures/skill/my-skill --prompt ./fixtures/prompt/my-prompt.md --sub-agent ./fixtures/sub-agent/my-agent.md
    Then config and sub-agent are native TOML: node --input-type=module -e 'import{createRequire}from"node:module";import fs from"node:fs";import a from"node:assert/strict";const require=createRequire(process.env.PROJECT_ROOT+"/package.json"),{parse}=require("smol-toml"),r=process.env.CODEX_HOME,c=parse(fs.readFileSync(r+"/config.toml","utf8")),s=parse(fs.readFileSync(r+"/agents/my-agent.toml","utf8"));a.deepEqual(JSON.parse(JSON.stringify(c.mcp_servers.playwright)),JSON.parse(fs.readFileSync("fixtures/mcp/playwright.json")));a.equal(s.description,"A test sub-agent for scenario testing.");a.match(s.developer_instructions,/Respond helpfully/);'
    And the effective override is updated without writing an ignored default: grep -F 'Existing override' "$CODEX_HOME/AGENTS.override.md" && grep -F 'agent-add:my-prompt' "$CODEX_HOME/AGENTS.override.md" && test ! -e "$CODEX_HOME/AGENTS.md"
    And skills use the documented independent home root: diff -r "$SETUP_TMPDIR/fixtures/skill/my-skill" "$HOME/.agents/skills/my-skill" && test ! -e "$CODEX_HOME/skills" && test ! -e "$HOME/.codex" && test ! -e "$SETUP_TMPDIR/.codex"

  @P0
  Scenario: Gemini user settings select user context without consulting project overrides
    Given the Gemini home parent is overridden: export GEMINI_CLI_HOME="$SETUP_TMPDIR/gemini-home"; mkdir -p "$GEMINI_CLI_HOME/.gemini" "$SETUP_TMPDIR/.gemini"; printf '{"context":{"fileName":["PERSONAL.md","SECOND.md"]}}' > "$GEMINI_CLI_HOME/.gemini/settings.json"; printf '{"context":{"fileName":"PROJECT.md"}}' > "$SETUP_TMPDIR/.gemini/settings.json"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --global --host gemini --prompt ./fixtures/prompt/my-prompt.md --command ./fixtures/command/my-command.md
    Then the prompt uses only the user filename: grep -F 'agent-add:my-prompt' "$GEMINI_CLI_HOME/.gemini/PERSONAL.md" && test ! -e "$SETUP_TMPDIR/PROJECT.md" && test ! -e "$GEMINI_CLI_HOME/.gemini/GEMINI.md" && test ! -e "$HOME/.gemini"
    And the command is parsed native TOML: node -e 'const require2=require("node:module").createRequire(process.env.PROJECT_ROOT+"/package.json"),{parse}=require2("smol-toml"),fs=require("node:fs"),a=require("node:assert/strict"),c=parse(fs.readFileSync(process.env.GEMINI_CLI_HOME+"/.gemini/commands/my-command.toml","utf8"));a.equal(c.description,"A test command for scenario testing.");a.match(c.prompt,/Run this command/);'

  @P0
  Scenario: Gemini user context cannot escape its selected root
    Given a user context attempts to escape: mkdir -p "$HOME/.gemini"; printf '{"context":{"fileName":"../../project/ESCAPE.md"}}' > "$HOME/.gemini/settings.json"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --global --host gemini --prompt ./fixtures/prompt/my-prompt.md > out.txt 2>&1; code=$?; test "$code" -eq 1
    Then the error reports the boundary and creates no escaped file: grep -F 'must stay inside the user configuration root' out.txt && test ! -e "$SETUP_TMPDIR/project/ESCAPE.md"

  @P0
  Scenario: Cline CLI honors specific MCP file override and independent rule root
    Given Cline roots are overridden: export CLINE_DIR="$SETUP_TMPDIR/cline-config" CLINE_DATA_DIR="$SETUP_TMPDIR/cline-data" CLINE_MCP_SETTINGS_PATH="$SETUP_TMPDIR/selected-mcp.json"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --global --host cline --mcp ./fixtures/mcp/playwright.json --prompt ./fixtures/prompt/my-prompt.md --skill ./fixtures/skill/my-skill
    Then the selected CLI MCP file is semantically correct: node -e 'const fs=require("node:fs"),a=require("node:assert/strict");a.deepEqual(JSON.parse(fs.readFileSync(process.env.CLINE_MCP_SETTINGS_PATH)).mcpServers.playwright,JSON.parse(fs.readFileSync("fixtures/mcp/playwright.json")));'
    And rule and skill destinations use CLINE_DIR: cmp fixtures/prompt/my-prompt.md "$CLINE_DIR/rules/my-prompt.md" && diff -r fixtures/skill/my-skill "$CLINE_DIR/skills/my-skill"
    And fallback MCP and project targets remain absent: test ! -e "$CLINE_DATA_DIR/settings/cline_mcp_settings.json" && test ! -e "$HOME/.cline" && test ! -e .cline

  @P0
  Scenario: Global-only OpenClaw rejects project installs and supports a state root
    When a project install is requested: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host openclaw --skill ./fixtures/skill/my-skill > out.txt 2>&1; code=$?; test "$code" -eq 2
    Then no project or default user tree exists: test ! -e .openclaw && test ! -e "$HOME/.openclaw"
    Given an explicit user state root: export OPENCLAW_STATE_DIR="$SETUP_TMPDIR/openclaw-state"
    When user scope is selected: node "$PROJECT_ROOT/bin/agent-add.js" --global --host openclaw --skill ./fixtures/skill/my-skill
    Then the complete skill bundle is in the state-owned root: diff -r fixtures/skill/my-skill "$OPENCLAW_STATE_DIR/skills/my-skill" && test ! -e "$HOME/.openclaw"

  @P0
  Scenario: Unselected root overrides fail without default writes
    Given an unselected opencode custom config is active: export OPENCODE_CONFIG="$SETUP_TMPDIR/custom.json"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --global --host opencode --skill ./fixtures/skill/my-skill > out.txt 2>&1; code=$?; test "$code" -eq 2
    Then the override is named and both destinations remain absent: grep -F OPENCODE_CONFIG out.txt && test ! -e "$HOME/.config/opencode" && test ! -e .opencode

  @P0
  Scenario: Global Zed instructions do not modify a project first-match rule
    Given a project first-match rule exists: printf 'Project rule stays unchanged\n' > "$SETUP_TMPDIR/.rules"; cp "$SETUP_TMPDIR/.rules" "$SETUP_TMPDIR/rules-before.txt"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --global --host zed --prompt ./fixtures/prompt/my-prompt.md
    Then personal guidance is written separately: grep -F 'agent-add:my-prompt' "$HOME/.config/zed/AGENTS.md" && cmp .rules rules-before.txt && test ! -e AGENTS.md

  @P0
  Scenario: Vibe user assets use the overridden root and native TOML schemas
    Given the Vibe home is overridden: export VIBE_HOME="$SETUP_TMPDIR/vibe-home"
    When the user runs: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --global --host vibe --mcp ./fixtures/mcp/playwright.json --prompt ./fixtures/prompt/my-prompt.md --skill ./fixtures/skill/my-skill --sub-agent ./fixtures/sub-agent/my-agent.md
    Then native MCP and sub-agent values survive decoding: node -e 'const require2=require("node:module").createRequire(process.env.PROJECT_ROOT+"/package.json"),{parse}=require2("smol-toml"),fs=require("node:fs"),a=require("node:assert/strict"),r=process.env.VIBE_HOME,c=parse(fs.readFileSync(r+"/config.toml","utf8")),s=parse(fs.readFileSync(r+"/agents/my-agent.toml","utf8"));a.deepEqual(JSON.parse(JSON.stringify(c.mcp_servers)),[{name:"playwright",transport:"stdio",command:"npx",args:["@playwright/mcp@latest"],env:{}}]);a.equal(s.agent_type,"subagent");a.equal(s.description,"A test sub-agent for scenario testing.");a.match(s.instructions,/Respond helpfully/);'
    And instructions and the whole skill bundle use the same root: grep -F 'agent-add:my-prompt' "$VIBE_HOME/AGENTS.md" && diff -r fixtures/skill/my-skill "$VIBE_HOME/skills/my-skill" && test ! -e "$HOME/.vibe" && test ! -e .vibe

  @P0
  Scenario: Claude configuration relocation works for non-MCP assets without guessing MCP state
    Given the Claude root is overridden: export CLAUDE_CONFIG_DIR="$SETUP_TMPDIR/claude-home"
    When user instructions and skills are installed: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --global --host claude-code --prompt ./fixtures/prompt/my-prompt.md --skill ./fixtures/skill/my-skill
    Then the override is honored: grep -F 'agent-add:my-prompt' "$CLAUDE_CONFIG_DIR/CLAUDE.md" && diff -r fixtures/skill/my-skill "$CLAUDE_CONFIG_DIR/skills/my-skill"
    When MCP is requested with the unselected override: node "$PROJECT_ROOT/bin/agent-add.js" --global --host claude-code --mcp ./fixtures/mcp/playwright.json > out.txt 2>&1; code=$?; test "$code" -eq 2
    Then the failure names the combination without guessing a destination: grep -F 'CLAUDE_CONFIG_DIR for MCP' out.txt && test ! -e "$HOME/.claude.json" && test ! -e "$CLAUDE_CONFIG_DIR/.claude.json" && test ! -e .mcp.json

  @P0
  Scenario: User skills with the same name coexist and reinstall independently
    When both scopes are installed and reinstalled: cd "$SETUP_TMPDIR" && node "$PROJECT_ROOT/bin/agent-add.js" --host claude-code --skill ./fixtures/skill/my-skill && node "$PROJECT_ROOT/bin/agent-add.js" --global --host claude-code --skill ./fixtures/skill/my-skill && node "$PROJECT_ROOT/bin/agent-add.js" --global --host claude-code --skill ./fixtures/skill/my-skill > out.txt
    Then both complete bundles exist and user reinstall is idempotent: diff -r fixtures/skill/my-skill .claude/skills/my-skill && diff -r fixtures/skill/my-skill "$HOME/.claude/skills/my-skill" && grep -F '≡ exists' out.txt
