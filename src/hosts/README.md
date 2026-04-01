# Host Capability Matrix

This file is the **single source of truth** for all host adapter configurations in `agent-add`.
Every adapter in `src/hosts/<id>.ts` must match the paths and capabilities documented here.

---

## Capability Matrix

> ✅ = supported | ❌ = not supported
>
> Sorted by number of supported asset types (descending).

| Host | ID | MCP | Prompt | Skill | Command | Sub-agent |
|------|----|-----|--------|-------|---------|-----------|
| Cursor | `cursor` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Claude Code | `claude-code` | ✅ | ✅ | ✅ | ✅ | ✅ |
| GitHub Copilot | `github-copilot` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gemini CLI | `gemini` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kilo Code | `kilo-code` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Qwen Code | `qwen-code` | ✅ | ✅ | ✅ | ✅ | ✅ |
| opencode | `opencode` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Augment | `augment` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Windsurf | `windsurf` | ✅ | ✅ | ✅ | ✅ | ❌ |
| Roo Code | `roo-code` | ✅ | ✅ | ✅ | ✅ | ❌ |
| Kiro CLI | `kiro` | ✅ | ✅ | ✅ | ❌ | ✅ |
| Codex CLI | `codex` | ✅ (TOML) | ✅ | ✅ | ❌ | ✅ (TOML) |
| Tabnine CLI | `tabnine` | ✅ | ✅ | ❌ | ✅ | ❌ |
| Kimi Code | `kimi` | ✅ | ✅ | ✅ | ❌ | ❌ |
| Trae | `trae` | ✅ | ✅ | ✅ | ❌ | ❌ |
| OpenClaw | `openclaw` | ❌ | ✅ | ✅ | ❌ | ❌ |
| Mistral Vibe | `vibe` | ✅ (TOML) | ✅ | ✅ | ❌ | ❌ |
| Claude Desktop | `claude-desktop` | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Host Configuration Details

### Cursor

- **Docs**: https://cursor.com/docs
- **MCP**: `.cursor/mcp.json` → key `mcpServers` (strategy: `inject-json-key`)
- **Prompt**: `AGENTS.md` in project root (strategy: `append-with-marker`)
- **Skill**: `.cursor/skills/<name>/SKILL.md` (strategy: `copy-file`)
- **Command**: `.cursor/commands/<name>.md` (strategy: `copy-file`)
- **Sub-agent**: `.cursor/agents/<name>.md` (strategy: `copy-file`)

### Claude Code

- **Docs**: https://code.claude.com/docs/en
- **MCP**: `.mcp.json` → key `mcpServers` (strategy: `inject-json-key`)
- **Prompt**: `CLAUDE.md` in project root (strategy: `append-with-marker`)
- **Skill**: `.claude/skills/<name>/SKILL.md` (strategy: `copy-file`)
- **Command**: `.claude/commands/<name>.md` (strategy: `copy-file`)
- **Sub-agent**: `.claude/agents/<name>.md` (strategy: `copy-file`)

### GitHub Copilot

- **Docs**: https://docs.github.com/en/copilot/tutorials/enhance-agent-mode-with-mcp
- **MCP**: `.vscode/mcp.json` → key `servers` (strategy: `inject-json-key`)
- **Prompt**: `.github/copilot-instructions.md` (strategy: `append-with-marker`)
- **Skill**: `.github/skills/<name>/SKILL.md` (strategy: `copy-file`)
- **Command**: `.github/prompts/<name>.prompt.md` (strategy: `copy-file`)
- **Sub-agent**: `.github/agents/<name>.agent.md` (strategy: `copy-file`)

### Gemini CLI

- **Docs**: https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html
- **MCP**: `.gemini/settings.json` → key `mcpServers` (strategy: `inject-json-key`)
- **Prompt**: `GEMINI.md` in project root (strategy: `append-with-marker`)
- **Skill**: `.gemini/skills/<name>/SKILL.md` (strategy: `copy-file`)
- **Command**: `.gemini/commands/<name>.toml` (strategy: `copy-file`)
- **Sub-agent**: `.gemini/agents/<name>.md` (strategy: `copy-file`)

### Kilo Code

- **Docs**: https://kilo.ai/docs/automate/mcp/using-in-kilo-code
- **MCP**: `.kilocode/mcp.json` → key `mcpServers` (strategy: `inject-json-key`)
- **Prompt**: `.kilocode/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.kilocode/rules`)
- **Skill**: `.kilocode/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.kilocode/skills`)
- **Command**: `.kilocode/commands/<name>.md` (strategy: `copy-file`, installDir: `.kilocode/commands`)
- **Sub-agent**: `.kilocode/agents/<name>.md` (strategy: `copy-file`, installDir: `.kilocode/agents`)

### Qwen Code

- **Docs**: https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/
- **MCP**: `.qwen/settings.json` → key `mcpServers` (strategy: `inject-json-key`)
- **Prompt**: `AGENTS.md` in project root (strategy: `append-with-marker`)
- **Skill**: `.qwen/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.qwen/skills`)
- **Command**: `.qwen-code/commands/<name>.md` (strategy: `copy-file`, installDir: `.qwen-code/commands`)
- **Sub-agent**: `.qwen/agents/<name>.md` (strategy: `copy-file`, installDir: `.qwen/agents`)

### opencode

- **Docs**: https://opencode.ai/docs
- **MCP**: `opencode.json` → key `mcp` (strategy: `inject-json-key`)
- **Prompt**: `AGENTS.md` in project root (strategy: `append-with-marker`)
- **Skill**: `.opencode/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.opencode/skills`)
- **Command**: `.opencode/commands/<name>.md` (strategy: `copy-file`, installDir: `.opencode/commands`)
- **Sub-agent**: `.opencode/agents/<name>.md` (strategy: `copy-file`, installDir: `.opencode/agents`)

### Augment

- **Docs**: https://docs.augmentcode.com/setup-augment/mcp
- **MCP**:
  - macOS/Linux: `~/.augment/settings.json` → key `mcpServers`
  - Windows: `%USERPROFILE%\.augment\settings.json` → key `mcpServers`
- **Prompt**: `.augment/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.augment/rules`)
- **Skill**: `.augment/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.augment/skills`)
- **Command**: `.augment/commands/<name>.md` (strategy: `copy-file`, installDir: `.augment/commands`)
- **Sub-agent**: `.augment/agents/<name>.md` (strategy: `copy-file`, installDir: `.augment/agents`)

### Windsurf

- **Docs**: https://docs.windsurf.com/windsurf/cascade/mcp
- **MCP**:
  - macOS/Linux: `~/.codeium/windsurf/mcp_config.json` → key `mcpServers`
  - Windows: `%APPDATA%\Codeium\windsurf\mcp_config.json` → key `mcpServers`
- **Prompt**: `.windsurf/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.windsurf/rules`)
- **Skill**: `.windsurf/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.windsurf/skills`)
- **Command**: `.windsurf/workflows/<name>.md` (strategy: `copy-file`, installDir: `.windsurf/workflows`)
- **Sub-agent**: ❌ — Windsurf does not have a sub-agent file format.

### Roo Code

- **Docs**: https://docs.roocode.com/features/mcp/using-mcp-in-roo
- **MCP**: `.roo/mcp.json` → key `mcpServers` (strategy: `inject-json-key`)
- **Prompt**: `.roo/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.roo/rules`)
- **Skill**: `.roo/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.roo/skills`)
- **Command**: `.roo/commands/<name>.md` (strategy: `copy-file`, installDir: `.roo/commands`)
- **Sub-agent**: ❌ — Roo Code does not support sub-agent configuration files.

### Kiro CLI

- **Docs**: https://kiro.dev/docs/mcp/
- **MCP**: `.kiro/settings/mcp.json` → key `mcpServers` (strategy: `inject-json-key`)
- **Prompt**: `.kiro/steering/<name>.md` (strategy: `create-file-in-dir`, installDir: `.kiro/steering`)
- **Skill**: `.kiro/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.kiro/skills`)
- **Command**: ❌ — Kiro does not support custom slash commands via files.
- **Sub-agent**: `.kiro/agents/<name>.md` (strategy: `copy-file`, installDir: `.kiro/agents`)

### Codex CLI

- **Docs**: https://github.com/openai/codex
- **MCP**:
  - macOS/Linux: `~/.codex/config.toml` (TOML table format: `[mcp_servers.<name>]`)
  - Windows: `%USERPROFILE%\.codex\config.toml`
- **Prompt**: `AGENTS.md` in project root (strategy: `append-with-marker`)
- **Skill**: `.codex/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.codex/skills`)
- **Command**: ❌ — Codex CLI does not support custom slash commands via files.
- **Sub-agent**: `.codex/agents/<name>.toml` (strategy: `copy-file`, installDir: `.codex/agents`)

### Tabnine CLI

- **Docs**: https://docs.tabnine.com/main/getting-started/tabnine-agent/guidelines
- **MCP**: `.tabnine/mcp_servers.json` → key `mcpServers` (strategy: `inject-json-key`)
- **Prompt**: `.tabnine/guidelines/<name>.md` (strategy: `create-file-in-dir`, installDir: `.tabnine/guidelines`)
- **Skill**: ❌ — Tabnine CLI does not support project-level skill directories.
- **Command**: `.tabnine/agent/commands/<name>.md` (strategy: `copy-file`, installDir: `.tabnine/agent/commands`)
- **Sub-agent**: ❌ — Tabnine CLI does not support sub-agent configuration files.

### Kimi Code

- **Docs**: https://moonshotai.github.io/kimi-cli/en/customization/mcp.html
- **MCP**:
  - macOS/Linux: `~/.kimi/mcp.json` → key `mcpServers`
  - Windows: `%USERPROFILE%\.kimi\mcp.json` → key `mcpServers`
- **Prompt**: `AGENTS.md` in project root (strategy: `append-with-marker`)
- **Skill**: `.kimi/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.kimi/skills`)
- **Command**: ❌ — Kimi Code does not support custom slash commands via files.
- **Sub-agent**: ❌ — Kimi Code does not support sub-agent configuration files.

### Trae

- **Docs**: https://docs.trae.ai/ide/model-context-protocol
- **MCP**: `.trae/mcp.json` → key `mcpServers` (strategy: `inject-json-key`)
- **Prompt**: `.trae/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.trae/rules`)
- **Skill**: `.trae/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.trae/skills`)
- **Command**: ❌ — Trae does not support custom slash commands via files.
- **Sub-agent**: ❌ — Trae does not support sub-agent configuration files.

### OpenClaw

- **Docs**: https://openclawlab.com/en/docs/tools/skills-config/
- **MCP**: ❌ — Native MCP support was marked NOT_PLANNED by maintainers (GitHub issue #4834).
- **Prompt**: `AGENTS.md` in project root (strategy: `append-with-marker`)
- **Skill**: `.openclaw/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.openclaw/skills`)
- **Command**: ❌ — OpenClaw does not support custom slash commands via files.
- **Sub-agent**: ❌ — OpenClaw does not support sub-agent configuration files.

### Mistral Vibe

- **Docs**: https://docs.mistral.ai/mistral-vibe/introduction/configuration
- **MCP**: `.vibe/config.toml` (TOML array format: `[[mcp_servers]]`)
- **Prompt**: `AGENTS.md` in project root (strategy: `append-with-marker`)
- **Skill**: `.vibe/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.vibe/skills`)
- **Command**: ❌ — Mistral Vibe does not support custom slash commands via files.
- **Sub-agent**: ❌ — Mistral Vibe does not support sub-agent configuration files.

### Claude Desktop

- **Docs**: https://modelcontextprotocol.io/quickstart/user
- **MCP**:
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json` → key `mcpServers`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json` → key `mcpServers`
  - Linux: `~/.config/Claude/claude_desktop_config.json` → key `mcpServers`
- **Prompt**: ❌ — UI-based chat application, no project-level rules files
- **Skill**: ❌ — UI-based chat application, no skill directory
- **Command**: ❌ — UI-based chat application, no custom slash commands
- **Sub-agent**: ❌ — UI-based chat application, no sub-agent config files

---

## How to Add a New Host (Contribution Guide)

1. **Create the adapter file**: `src/hosts/<id>.ts`
   - Export a class `XxxAdapter implements HostAdapter`
   - Hardcode all configuration fields
   - Use `NOT_SUPPORTED(reason)` helper for unsupported asset types
   - Reference the official docs link to confirm all paths

2. **Register in index.ts**: Add `['<id>', new XxxAdapter()]` to the `hostRegistry` Map in `src/hosts/index.ts`

3. **Update this README**: Add a row to the capability matrix table and a new detail section with:
   - Official docs link
   - MCP config file path(s) per platform
   - Prompt install path and write strategy
   - Skill install path (if supported)
   - Reason strings for unsupported asset types

4. **Add unit tests**: Create `tests/unit/hosts/<id>.test.ts`
   - Verify `adapter.id`, `adapter.displayName`, `adapter.docs` values
   - Verify each asset capability matches the matrix in this README
   - Verify supported capabilities have required fields (configFile, installDir, etc.)
