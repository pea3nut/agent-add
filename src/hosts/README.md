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

Homepage: https://cursor.com/docs

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://cursor.com/docs/context/mcp | 项目级 `.cursor/mcp.json`，全局 `~/.cursor/mcp.json`，key `mcpServers` | `.cursor/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://cursor.com/docs/context/rules | `.cursor/rules/*.mdc` 为原生规则；同时支持 `AGENTS.md` 作为跨工具标准 | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://cursor.com/docs/skills | `.cursor/skills/` (项目) 或 `~/.cursor/skills/` (用户)，每个 skill 含 `SKILL.md` 入口 | `.cursor/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://cursor.com/docs/context/commands | `.cursor/commands/[command].md`，自 v1.6 引入 | `.cursor/commands/<name>.md` (strategy: `copy-file`) |
| Sub-agent | https://cursor.com/docs/subagents | `.cursor/agents/` (项目) 或 `~/.cursor/agents/` (用户)，Markdown 格式 | `.cursor/agents/<name>.md` (strategy: `copy-file`) |

### Claude Code

Homepage: https://code.claude.com/docs/en

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://code.claude.com/docs/en/mcp | 项目级共享 `.mcp.json`，key `mcpServers`；用户级 `~/.claude.json` | `.mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://code.claude.com/docs/en/memory | `./CLAUDE.md` 或 `./.claude/CLAUDE.md`；用户级 `~/.claude/CLAUDE.md` | `CLAUDE.md` in project root (strategy: `append-with-marker`) |
| Skill | https://code.claude.com/docs/en/skills | `.claude/skills/<skill-name>/SKILL.md`（项目）或 `~/.claude/skills/`（个人） | `.claude/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://code.claude.com/docs/en/skills | Commands 已合并入 skills，`.claude/commands/` 路径仍向后兼容 | `.claude/commands/<name>.md` (strategy: `copy-file`) |
| Sub-agent | https://code.claude.com/docs/en/sub-agents | `.claude/agents/`（项目）或 `~/.claude/agents/`（用户），Markdown + YAML frontmatter | `.claude/agents/<name>.md` (strategy: `copy-file`) |

### GitHub Copilot

Homepage: https://docs.github.com/en/copilot

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.github.com/copilot/customizing-copilot/using-model-context-protocol/extending-copilot-chat-with-mcp | `.vscode/mcp.json`，顶层 key `servers` | `.vscode/mcp.json` → key `servers` (strategy: `inject-json-key`) |
| Prompt | https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot | `.github/copilot-instructions.md`；也支持 `.github/instructions/*.instructions.md` 和 `AGENTS.md` | `.github/copilot-instructions.md` (strategy: `append-with-marker`) |
| Skill | https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-skills | `.github/skills/<name>/SKILL.md`，需 YAML frontmatter（name, description） | `.github/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://docs.github.com/en/copilot/tutorials/customization-library/prompt-files/your-first-prompt-file | `.github/prompts/<name>.prompt.md`，YAML frontmatter + `/<name>` 调用 | `.github/prompts/<name>.prompt.md` (strategy: `copy-file`) |
| Sub-agent | https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents | `.github/agents/<name>.agent.md`，YAML frontmatter（name, description, tools, model） | `.github/agents/<name>.agent.md` (strategy: `copy-file`) |

### Gemini CLI

Homepage: https://google-gemini.github.io/gemini-cli/

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html | `~/.gemini/settings.json`（用户）或 `.gemini/settings.json`（项目），key `mcpServers` | `.gemini/settings.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://geminicli.com/docs/cli/gemini-md.html | 三级层次：`~/.gemini/GEMINI.md`（全局）、项目根 `GEMINI.md`、子目录 `GEMINI.md` | `GEMINI.md` in project root (strategy: `append-with-marker`) |
| Skill | https://geminicli.com/docs/cli/skills/ | `.gemini/skills/`（项目）或 `~/.gemini/skills/`（用户），每个含 `SKILL.md` | `.gemini/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://geminicli.com/docs/cli/custom-commands.html | `~/.gemini/commands/`（全局）或 `.gemini/commands/`（项目），TOML 格式 | `.gemini/commands/<name>.toml` (strategy: `copy-file`) |
| Sub-agent | https://geminicli.com/docs/core/subagents/ | `.gemini/agents/*.md`（项目）或 `~/.gemini/agents/*.md`（用户），Markdown + YAML frontmatter | `.gemini/agents/<name>.md` (strategy: `copy-file`) |

### Kilo Code

Homepage: https://kilo.ai/docs

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://kilo.ai/docs/automate/mcp/using-in-kilo-code | `.kilocode/mcp.json`，key `mcpServers` | `.kilocode/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://kilo.ai/docs/customize/custom-rules | `.kilo/rules/<name>.md`（新版）；旧版 `.kilocode/rules/` 兼容；通过 `kilo.jsonc` 的 `instructions` 引用 | `.kilocode/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.kilocode/rules`) |
| Skill | https://kilo.ai/docs/customize/skills | `.kilo/skills/<name>/SKILL.md`（新版）；旧版 `.kilocode/skills/` 兼容；须含 YAML frontmatter（name, description） | `.kilocode/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.kilocode/skills`) |
| Command | https://kilo.ai/docs/customize/workflows | `.kilo/commands/<name>.md`（新版）；旧版 `.kilocode/workflows/` 自动迁移；支持 YAML frontmatter | `.kilocode/commands/<name>.md` (strategy: `copy-file`, installDir: `.kilocode/commands`) |
| Sub-agent | https://kilo.ai/docs/customize/custom-subagents | `.kilo/agents/<name>.md`（新版）；旧版 `.kilocode/agents/` 兼容；文件名即 agent 标识 | `.kilocode/agents/<name>.md` (strategy: `copy-file`, installDir: `.kilocode/agents`) |

### Qwen Code

Homepage: https://qwenlm.github.io/qwen-code-docs/en/

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/ | `.qwen/settings.json`，key `mcpServers` | `.qwen/settings.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://qwenlm.github.io/qwen-code-docs/en/users/configuration/settings/ | 默认搜索 `AGENTS.md`（优先）和 `QWEN.md`；可通过 `context.fileName` 配置 | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/ | `.qwen/skills/<skill-name>/SKILL.md`（项目）；`~/.qwen/skills/`（个人） | `.qwen/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.qwen/skills`) |
| Command | https://qwenlm.github.io/qwen-code-docs/en/users/features/commands/ | `.qwen/commands/`（项目）；`~/.qwen/commands/`（用户）；Markdown + YAML frontmatter | `.qwen/commands/<name>.md` (strategy: `copy-file`, installDir: `.qwen/commands`) |
| Sub-agent | https://qwenlm.github.io/qwen-code-docs/en/users/features/sub-agents/ | `.qwen/agents/`（项目）；`~/.qwen/agents/`（用户）；Markdown + YAML frontmatter | `.qwen/agents/<name>.md` (strategy: `copy-file`, installDir: `.qwen/agents`) |

### opencode

Homepage: https://opencode.ai/docs

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://opencode.ai/docs/config | `opencode.json`，key `mcp`，示例 `{"mcp": {"jira": {...}}}` | `opencode.json` → key `mcp` (strategy: `inject-json-key`) |
| Prompt | https://opencode.ai/docs/rules | 项目级 `AGENTS.md` 在根目录；全局 `~/.config/opencode/AGENTS.md`；也支持 `CLAUDE.md` fallback | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://opencode.ai/docs/skills | `.opencode/skills/<name>/SKILL.md`（项目）；全局 `~/.config/opencode/skills/` | `.opencode/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.opencode/skills`) |
| Command | https://opencode.ai/docs/commands | `.opencode/commands/`（项目）；全局 `~/.config/opencode/commands/`；Markdown + YAML frontmatter | `.opencode/commands/<name>.md` (strategy: `copy-file`, installDir: `.opencode/commands`) |
| Sub-agent | https://opencode.ai/docs/agents | `.opencode/agents/`（项目）或 `~/.config/opencode/agents/`；Markdown + YAML frontmatter | `.opencode/agents/<name>.md` (strategy: `copy-file`, installDir: `.opencode/agents`) |

### Augment

Homepage: https://docs.augmentcode.com/

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.augmentcode.com/setup-augment/mcp | `~/.augment/settings.json`，key `mcpServers`；VS Code 扩展通过设置面板管理 | macOS/Linux: `~/.augment/settings.json` → key `mcpServers`; Windows: `%USERPROFILE%\.augment\settings.json` → key `mcpServers` |
| Prompt | https://docs.augmentcode.com/setup-augment/guidelines | 用户级 `~/.augment/rules/`；工作区级 `.augment/rules/`；也支持 `AGENTS.md`/`CLAUDE.md` | `.augment/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.augment/rules`) |
| Skill | https://docs.augmentcode.com/using-augment/skills | `.augment/skills/<name>/SKILL.md`；也兼容 `.claude/skills/` | `.augment/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.augment/skills`) |
| Command | https://docs.augmentcode.com/using-augment/custom-commands | 用户级 `~/.augment/commands/`；工作区级 `.augment/commands/<name>.md` | `.augment/commands/<name>.md` (strategy: `copy-file`, installDir: `.augment/commands`) |
| Sub-agent | https://docs.augmentcode.com/cli/subagents | 用户级 `~/.augment/agents/`；工作区级 `.augment/agents/`；Markdown + YAML frontmatter | `.augment/agents/<name>.md` (strategy: `copy-file`, installDir: `.augment/agents`) |

### Windsurf

Homepage: https://docs.windsurf.com/

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.windsurf.com/windsurf/cascade/mcp | `~/.codeium/windsurf/mcp_config.json`，key `mcpServers` | macOS/Linux: `~/.codeium/windsurf/mcp_config.json` → key `mcpServers`; Windows: `%APPDATA%\Codeium\windsurf\mcp_config.json` → key `mcpServers` |
| Prompt | https://docs.windsurf.com/windsurf/cascade/memories | `.windsurf/rules/*.md`，Markdown + frontmatter | `.windsurf/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.windsurf/rules`) |
| Skill | https://docs.windsurf.com/windsurf/cascade/skills | `.windsurf/skills/<skill-name>/`，需 `SKILL.md` 入口 + frontmatter（name, description） | `.windsurf/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.windsurf/skills`) |
| Command | https://docs.windsurf.com/windsurf/cascade/workflows | `.windsurf/workflows/*.md` | `.windsurf/workflows/<name>.md` (strategy: `copy-file`, installDir: `.windsurf/workflows`) |
| Sub-agent | ❌ | ❌ | Windsurf does not have a sub-agent file format. |

### Roo Code

Homepage: https://docs.roocode.com/

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.roocode.com/features/mcp/using-mcp-in-roo | 项目级 `.roo/mcp.json`，key `mcpServers` | `.roo/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.roocode.com/features/custom-instructions | `.roo/rules/` 目录递归加载，按文件名排序；也支持 `.roo/rules-{modeSlug}/` | `.roo/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.roo/rules`) |
| Skill | https://docs.roocode.com/features/skills | `.roo/skills/{skill-name}/SKILL.md`，frontmatter 须含 name 和 description | `.roo/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.roo/skills`) |
| Command | https://docs.roocode.com/features/slash-commands | `.roo/commands/`，文件名即命令名（如 `review.md` → `/review`） | `.roo/commands/<name>.md` (strategy: `copy-file`, installDir: `.roo/commands`) |
| Sub-agent | ❌ | ❌ | Roo Code does not support sub-agent configuration files. |

### Kiro CLI

Homepage: https://kiro.dev/docs/

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://kiro.dev/docs/mcp/configuration/ | 工作区 `.kiro/settings/mcp.json`，用户级 `~/.kiro/settings/mcp.json`，key `mcpServers` | `.kiro/settings/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://kiro.dev/docs/steering/ | `.kiro/steering/` 目录，Markdown 格式，文件名自定义 | `.kiro/steering/<name>.md` (strategy: `create-file-in-dir`, installDir: `.kiro/steering`) |
| Skill | https://kiro.dev/docs/skills/ | `.kiro/skills/`，每个 skill 独立目录含 `SKILL.md` | `.kiro/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.kiro/skills`) |
| Command | ❌ | ❌ | Kiro does not support custom slash commands via files. |
| Sub-agent | https://kiro.dev/docs/chat/subagents/ | `.kiro/agents/`（工作区）或 `~/.kiro/agents`（全局），Markdown + YAML frontmatter | `.kiro/agents/<name>.md` (strategy: `copy-file`, installDir: `.kiro/agents`) |

### Codex CLI

Homepage: https://github.com/openai/codex

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://developers.openai.com/codex/mcp | 全局 `~/.codex/config.toml`，项目级 `.codex/config.toml`；TOML table `[mcp_servers.<server-name>]` | macOS/Linux: `~/.codex/config.toml` (TOML table format: `[mcp_servers.<name>]`); Windows: `%USERPROFILE%\.codex\config.toml` |
| Prompt | https://developers.openai.com/codex/guides/agents-md | `AGENTS.md` 在仓库根目录及子目录；全局 `~/.codex/AGENTS.md` | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | (unknown) | `.codex/skills/` 和 `~/.codex/skills/`，每个含 `SKILL.md`（社区博客确认，官方文档未找到专页） | `.codex/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.codex/skills`) |
| Command | ❌ | ❌ | Codex CLI does not support custom slash commands via files. |
| Sub-agent | https://developers.openai.com/codex/subagents | 独立 TOML 文件，`~/.codex/agents/`（个人）或 `.codex/agents/`（项目），须含 name/description/developer_instructions | `.codex/agents/<name>.toml` (strategy: `copy-file`, installDir: `.codex/agents`) |

### Tabnine CLI

Homepage: https://docs.tabnine.com/

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.tabnine.com/main/getting-started/tabnine-agent/mcp-intro-and-setup | `.tabnine/mcp_servers.json`（项目级或 home），key `mcpServers` | `.tabnine/mcp_servers.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.tabnine.com/main/getting-started/tabnine-agent/guidelines | `$PROJECT/.tabnine/guidelines/` 或 `~/.tabnine/guidelines/`，Markdown 格式 | `.tabnine/guidelines/<name>.md` (strategy: `create-file-in-dir`, installDir: `.tabnine/guidelines`) |
| Skill | ❌ | ❌ | Tabnine CLI does not support project-level skill directories. |
| Command | https://docs.tabnine.com/main/getting-started/tabnine-cli/features/cli-commands | 全局 `~/.tabnine/agent/commands/`，项目级 `.tabnine/agent/commands/`，Markdown 文件 | `.tabnine/agent/commands/<name>.md` (strategy: `copy-file`, installDir: `.tabnine/agent/commands`) |
| Sub-agent | ❌ | ❌ | Tabnine CLI does not support sub-agent configuration files. |

### Kimi Code

Homepage: https://moonshotai.github.io/kimi-cli/

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://moonshotai.github.io/kimi-cli/en/customization/mcp.html | `~/.kimi/mcp.json`，key `mcpServers`，格式兼容其他 MCP 客户端 | macOS/Linux: `~/.kimi/mcp.json` → key `mcpServers`; Windows: `%USERPROFILE%\.kimi\mcp.json` → key `mcpServers` |
| Prompt | https://moonshotai.github.io/kimi-cli/en/customization/agents.html | `${KIMI_AGENTS_MD}` 变量合并项目根到工作目录的 `AGENTS.md`（含 `.kimi/AGENTS.md`） | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://moonshotai.github.io/kimi-cli/en/customization/skills.html | `.kimi/skills/`（也兼容 `.claude/skills/`），每个含 `SKILL.md` + YAML frontmatter | `.kimi/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.kimi/skills`) |
| Command | ❌ | ❌ | Kimi Code does not support custom slash commands via files. |
| Sub-agent | ❌ | ❌ | Kimi Code does not support sub-agent configuration files. |

### Trae

Homepage: https://docs.trae.ai/

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.trae.ai/ide/model-context-protocol | 支持 stdio/SSE/Streamable HTTP；文档侧重 UI 操作，底层文件为 `.trae/mcp.json` | `.trae/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.trae.ai/ide/rules | `.trae/rules/` 目录，每条规则为 `.md` 文件 + YAML frontmatter（alwaysApply, description, globs）；也兼容 AGENTS.md | `.trae/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.trae/rules`) |
| Skill | https://docs.trae.ai/ide/skills | `.trae/skills/{skill_name}/SKILL.md`（项目），`~/.trae/skills`（全局）；YAML frontmatter（name, description） | `.trae/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.trae/skills`) |
| Command | ❌ | ❌ | Trae does not support custom slash commands via files. |
| Sub-agent | ❌ | ❌ | Trae does not support sub-agent configuration files. |

### OpenClaw

Homepage: https://openclawlab.com/en/docs/

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | ❌ | ❌ — GitHub issue #4834 已关闭，状态 "not planned" | Native MCP support was marked NOT_PLANNED by maintainers (GitHub issue #4834). |
| Prompt | (unknown) | 文档索引确认支持 `AGENTS.md` | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://openclawlab.com/en/docs/tools/skills-config/ | 全局路径 `~/.openclaw/workspace/skills/<name>/SKILL.md`；skill 为含 `SKILL.md` 的目录 | `.openclaw/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.openclaw/skills`) |
| Command | ❌ | ❌ | OpenClaw does not support custom slash commands via files. |
| Sub-agent | ❌ | ❌ | OpenClaw does not support sub-agent configuration files. |

### Mistral Vibe

Homepage: https://docs.mistral.ai/mistral-vibe/

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.mistral.ai/mistral-vibe/introduction/configuration | `.vibe/config.toml` 或 `~/.vibe/config.toml`；`[[mcp_servers]]` 数组语法；支持 http/streamable-http/stdio transport | `.vibe/config.toml` (TOML array format: `[[mcp_servers]]`) |
| Prompt | https://docs.mistral.ai/mistral-vibe/agents-skills | 支持 `AGENTS.md` 在 workspace root | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://docs.mistral.ai/mistral-vibe/agents-skills | 全局 `~/.vibe/skills/`，项目 `.vibe/skills/`；含 `SKILL.md` + YAML frontmatter | `.vibe/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.vibe/skills`) |
| Command | ❌ | ❌ | Mistral Vibe does not support custom slash commands via files. |
| Sub-agent | ❌ | ❌ | Mistral Vibe does not support sub-agent configuration files. |

### Claude Desktop

Homepage: https://claude.ai/

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://modelcontextprotocol.io/quickstart/user | macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`; Windows: `%APPDATA%\Claude\claude_desktop_config.json`; key `mcpServers` | macOS: `~/Library/Application Support/Claude/claude_desktop_config.json` → key `mcpServers`; Windows: `%APPDATA%\Claude\claude_desktop_config.json` → key `mcpServers`; Linux: `~/.config/Claude/claude_desktop_config.json` → key `mcpServers` |
| Prompt | ❌ | ❌ | UI-based chat application, no project-level rules files |
| Skill | ❌ | ❌ | UI-based chat application, no skill directory |
| Command | ❌ | ❌ | UI-based chat application, no custom slash commands |
| Sub-agent | ❌ | ❌ | UI-based chat application, no sub-agent config files |

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
