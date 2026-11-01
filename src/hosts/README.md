# Host Capability Matrix

This file is the **single source of truth for target host adapter configurations** in `agent-add`.
It records upstream file contracts, not a guarantee that the current CLI implements every entry.
Adapters in `src/hosts/<id>.ts` should converge on these contracts; known gaps are listed below.

**Last verified: 2026-11-01 (UTC).** Sources are official product documentation unless explicitly labeled otherwise.
Descriptions below are paraphrases, not verbatim quotations. This audit changes documentation only.

### Scope and interpretation

- The first matrix covers the **18 registered adapters**. [New host candidates](#new-host-candidates-not-implemented) are separate: their proposed IDs are **not** accepted by `--host` yet.
- A capability means an installable **file contract**, not merely a similarly named UI feature or a built-in command. Skills that expose slash commands are not a second, independent command-file format.
- Relative paths are project-relative unless stated otherwise. `~` means the user's home directory, including on Windows; do not substitute `%APPDATA%` without upstream evidence. Respect documented config-home overrides and workspace trust.
- A Skill is a **directory bundle** with a `SKILL.md` entry point: preserve supporting scripts/resources, not just the entry file. Same-name discovery precedence is host-specific.
- Write strategies name installer operations, not upstream formats. JSONC/JSON5, TOML, nested keys, frontmatter and registration requirements must be handled explicitly; changing an extension or copying Markdown alone does not convert a format.
- This is a documentation audit, **not runtime validation in all hosts**. Unverified protocols remain unverified rather than being inferred from third-party host lists or old issues.

---

## Capability Matrix

> ✅ = documented file contract | ↪ = legacy, skill-backed, or requires registration (see details) | — = no standalone file contract verified
>
> These are upstream capabilities, **not current adapter implementation status**. CLI/IDE scope matters.

| Host | ID | MCP | Prompt | Skill | Command | Sub-agent |
|------|----|-----|--------|-------|---------|-----------|
| Cursor | `cursor` | ✅ | ✅ | ✅ | ↪ | ✅ |
| Claude Code | `claude-code` | ✅ | ✅ | ✅ | ↪ | ✅ |
| GitHub Copilot (VS Code) | `github-copilot` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gemini CLI | `gemini` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kilo Code | `kilo-code` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Qwen Code | `qwen-code` | ✅ | ✅ | ✅ | ✅ | ✅ |
| opencode | `opencode` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Augment / Auggie | `augment` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Windsurf | `windsurf` | ✅ | ✅ | ✅ | ✅ | — |
| Roo Code | `roo-code` | ✅ | ✅ | ✅ | ✅ | — |
| Kiro (CLI V3 / IDE 1.0) | `kiro` | ✅ | ✅ | ✅ | ↪ | ✅ |
| Codex CLI | `codex` | ✅ (TOML) | ✅ | ✅ | ↪ (deprecated) | ✅ (TOML) |
| Tabnine (IDE Agent / CLI; see scope below) | `tabnine` | ✅ | ✅ | — | ✅ (TOML) | — |
| Kimi Code CLI | `kimi` | ✅ | ✅ | ✅ | ↪ | ↪ (YAML + registration) |
| Trae | `trae` | ✅ | ✅ | ✅ | — | — |
| OpenClaw | `openclaw` | ✅ (JSON5) | ✅ | ✅ | ↪ | — |
| Mistral Vibe | `vibe` | ✅ (TOML) | ✅ | ✅ | ↪ | ✅ (TOML) |
| Claude Desktop | `claude-desktop` | ✅ | — | ↪ (UI upload) | — | — |

## Known Adapter Gaps (Not Fixed in This Audit)

These are follow-up implementation requirements, not a claim that the documentation-only change enables them.

| Host | Current adapter / installer behavior | Verified target or constraint |
|------|--------------------------------------|-------------------------------|
| Kilo Code | Uses `.kilocode/mcp.json`, `mcpServers`, and `.kilocode/` asset directories | New config is `kilo.jsonc` → `mcp`; local MCP uses a command **array** and `environment`. Use `.kilo/skills`, `.kilo/commands`, `.kilo/agents`; register rule paths in `instructions`. Legacy rule compatibility does not prove legacy MCP/agent paths still work. |
| Codex | Installs skills to `.codex/skills` | Use the documented `.agents/skills` project directory; user skills are `~/.agents/skills`. Do not present the old path as the current official contract. |
| Tabnine | Command extension is `.md` | CLI custom commands are **TOML** with `prompt` and optional `description`; copying/renaming Markdown is insufficient. MCP/guideline sources below describe IDE Agent, not proof of identical CLI discovery. |
| Mistral Vibe | Rejects Sub-agent and Command | Subagents have `.vibe/agents/<name>.toml` with `agent_type = "subagent"`; slash commands are skills, not a new commands directory. |
| Kimi | Rejects Sub-agent and Command | YAML agent files can be referenced in a parent agent's `subagents` mapping; load that parent with `--agent-file`. This needs registration and may involve a separate system-prompt file. Skill invocation is not a standalone command directory. |
| OpenClaw | Rejects MCP; installs skills to `.openclaw/skills` relative to cwd | Official MCP config is `~/.openclaw/openclaw.json` → nested `mcp.servers` (JSON5). Skills belong in the configured workspace's `skills/` or managed `~/.openclaw/skills/`; cwd is not automatically the agent workspace. |
| Kiro | Rejects Command; has no version/resource-registration distinctions | CLI V3 skills/manual steering expose slash invocation. Custom agents need explicit `resources` entries for skills/steering; older CLI 2.x agent schemas differ. |
| Windsurf | Windows MCP path is under `%APPDATA%` | Official path is home-relative `~/.codeium/windsurf/mcp_config.json`; verify Windows resolution instead of inventing a roaming-profile path. |
| Claude Desktop | Advertises a Linux MCP config path without a source | The official download page now offers Linux beta, but the cited local-MCP tutorial only specifies macOS/Windows paths. Linux's exact config path remains unverified here: do not confuse that with product unavailability. Skills are uploaded, not auto-discovered from a project directory. |
| Copilot / Augment | One host ID can be read as covering every client surface | Copilot's `.vscode/mcp.json` is VS Code-specific. Auggie's settings file is not evidence for the Augment IDE extension's on-disk configuration. Keep surfaces explicit. |

---

## Host Configuration Details

### Cursor

Homepage: https://cursor.com/docs

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://cursor.com/docs/context/mcp | 项目级 `.cursor/mcp.json`，全局 `~/.cursor/mcp.json`，key `mcpServers` | `.cursor/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://cursor.com/docs/context/rules | `.cursor/rules/*.mdc` 为原生规则；同时支持 `AGENTS.md` 作为跨工具标准 | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://cursor.com/docs/skills | `.cursor/skills/`、`.agents/skills/`（项目）；对应 home 目录（个人），含 `SKILL.md` | 保留 `.cursor/skills/<name>/SKILL.md` 为 host-specific 目标；支持目录 bundle |
| Command | https://cursor.com/changelog/1-6 ; https://cursor.com/docs/skills | v1.6 的 `.cursor/commands/<name>.md` 是旧协议；当前文档引导用 `/migrate-to-skills` 迁移命令到 skills | 标为 legacy；新增可复用工作流优先 `.cursor/skills/<name>/SKILL.md`，不要把 skills 页面跳转当作旧命令路径的最新证明 |
| Sub-agent | https://cursor.com/docs/subagents | `.cursor/agents/` (项目) 或 `~/.cursor/agents/` (用户)，Markdown 格式 | `.cursor/agents/<name>.md` (strategy: `copy-file`) |

### Claude Code

Homepage: https://code.claude.com/docs/en

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://code.claude.com/docs/en/mcp | 项目级共享 `.mcp.json`，key `mcpServers`；用户级 `~/.claude.json`；HTTP server 需 `type: "http"` | `.mcp.json` → key `mcpServers`；不能省略远程 transport 类型或覆盖已有用户配置 |
| Prompt | https://code.claude.com/docs/en/memory | `./CLAUDE.md` 或 `./.claude/CLAUDE.md`；用户级 `~/.claude/CLAUDE.md` | `CLAUDE.md` in project root (strategy: `append-with-marker`) |
| Skill | https://code.claude.com/docs/en/skills | `.claude/skills/<skill-name>/SKILL.md`（项目）或 `~/.claude/skills/`（个人） | `.claude/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://code.claude.com/docs/en/skills | Commands 已合并入 skills，`.claude/commands/` 路径仍向后兼容 | 旧 `.claude/commands/<name>.md` 可继续使用；新工作流推荐 `.claude/skills/<name>/SKILL.md` |
| Sub-agent | https://code.claude.com/docs/en/sub-agents | `.claude/agents/`（项目）或 `~/.claude/agents/`（用户），Markdown + YAML frontmatter | `.claude/agents/<name>.md` (strategy: `copy-file`) |

### GitHub Copilot

Homepage: https://docs.github.com/en/copilot

Scope: the adapter's MCP target is **VS Code**, not a universal Copilot CLI/cloud configuration. Copilot CLI uses [user `~/.copilot/mcp-config.json` or project `.mcp.json` / `.github/mcp.json`](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers), with key `mcpServers`; do not write `.vscode/mcp.json` and claim CLI support.

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://code.visualstudio.com/docs/copilot/customization/mcp-servers | VS Code 工作区 `.vscode/mcp.json`，顶层 key `servers`（不是 `mcpServers`）；server 需符合 VS Code 的 `type`/transport schema | `.vscode/mcp.json` → key `servers`；Agent Host 的原生 `.mcp.json` / `~/.copilot/mcp-config.json` 是另一个协议，不混用 |
| Prompt | https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot | `.github/copilot-instructions.md`；也支持 `.github/instructions/*.instructions.md` 和 `AGENTS.md` | `.github/copilot-instructions.md` (strategy: `append-with-marker`) |
| Skill | https://docs.github.com/en/copilot/concepts/agents/about-agent-skills | 项目 `.github/skills/`、`.claude/skills/`、`.agents/skills/`；个人 `~/.copilot/skills/`、`~/.agents/skills/` | `.github/skills/<name>/SKILL.md`，需 frontmatter（name, description）和完整目录 bundle |
| Command | https://docs.github.com/en/copilot/tutorials/customization-library/prompt-files/your-first-prompt-file | `.github/prompts/<name>.prompt.md`，YAML frontmatter + `/<name>` 调用 | `.github/prompts/<name>.prompt.md` (strategy: `copy-file`) |
| Sub-agent | https://code.visualstudio.com/docs/copilot/customization/custom-agents | VS Code 项目 `.github/agents/`，也支持 `.claude/agents/`；用户 `~/.copilot/agents/`；Markdown + YAML frontmatter | `.github/agents/<name>.agent.md`；遵循 VS Code schema，不直接拿 cloud-agent 的字段约束代替 |

### Gemini CLI

Homepage: https://geminicli.com/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://geminicli.com/docs/tools/mcp-server/ | `~/.gemini/settings.json`（用户）或 `.gemini/settings.json`（项目），key `mcpServers` | `.gemini/settings.json` → key `mcpServers`；保留 stdio / SSE / HTTP 各自字段，不能只替换顶层 key |
| Prompt | https://geminicli.com/docs/cli/gemini-md/ | 默认 `~/.gemini/GEMINI.md`（用户）与项目各层 `GEMINI.md`；可用 `context.fileName` 指定其他名称/名称列表（如 `AGENTS.md`） | 默认目标 `GEMINI.md`；需尊重用户已配置的 context 文件名，不声称始终读取默认文件 |
| Skill | https://geminicli.com/docs/cli/skills/ | `.gemini/skills/` 或 `.agents/skills/`（项目）；对应 home 目录（用户） | 同一 scope 中 `.agents/skills/` 优先于 `.gemini/skills/`；host-specific 目标仍可用 `.gemini/skills/<name>/SKILL.md` |
| Command | https://geminicli.com/docs/cli/custom-commands/ | 用户或项目 `.gemini/commands/`；TOML，必填 `prompt`，可选 `description` | `.gemini/commands/<name>.toml`；必须序列化 TOML，不是给 Markdown 改后缀；可用 `/commands reload` 重载 |
| Sub-agent | https://geminicli.com/docs/core/subagents/ | `.gemini/agents/*.md`（项目）或 `~/.gemini/agents/*.md`（用户），Markdown + YAML frontmatter | `.gemini/agents/<name>.md` (strategy: `copy-file`) |

### Kilo Code

Homepage: https://kilo.ai/docs

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://kilo.ai/docs/automate/mcp/using-in-kilo-code | 项目 `kilo.jsonc` / `.kilo/kilo.jsonc`（也支持 `.json`），用户 `~/.config/kilo/kilo.jsonc`；顶层 `mcp` | 本地 `{type: "local", command: [exe, ...args], environment: {...}}`；远程 `{type: "remote", url: ...}`；需 JSONC-aware 合并和 schema 转换 |
| Prompt | https://kilo.ai/docs/customize/custom-rules | `.kilo/rules/<name>.md` 通过 `kilo.jsonc` 的 `instructions` 文件路径或 glob 引用；旧 `.kilocode/rules/` 自动兼容 | 新安装需写规则文件 **并** 注册 `instructions`；单独创建新目录不够 |
| Skill | https://kilo.ai/docs/customize/skills | 项目 `.kilo/skills/`；用户 `~/.kilo/skills/`，也读取 `~/.agents/skills/` | `.kilo/skills/<name>/SKILL.md`，YAML frontmatter（name, description）；不沿用未经当前文档确认的旧目录 |
| Command | https://kilo.ai/docs/customize/workflows | 项目 `.kilo/commands/`；用户 `~/.config/kilo/commands/`；旧 `.kilocode/workflows/` 自动迁移 | `.kilo/commands/<name>.md`；不是 `.kilocode/commands/` |
| Sub-agent | https://kilo.ai/docs/customize/custom-subagents | 项目 `.kilo/agents/`；用户 `~/.config/kilo/agents/`；Markdown + YAML frontmatter | `.kilo/agents/<name>.md`；也可在 `kilo.jsonc` 的 `agent` 中定义 |

### Qwen Code

Homepage: https://qwenlm.github.io/qwen-code-docs/en/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/ | `.qwen/settings.json`，key `mcpServers` | `.qwen/settings.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://qwenlm.github.io/qwen-code-docs/en/blog/updates/weekly-update-2026-03-06/ | 官方更新明确项目根 `AGENTS.md` 会自动加载；不要在没有证据时承诺与 `QWEN.md` 的固定冲突优先级 | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/ | `.qwen/skills/<skill-name>/SKILL.md`（项目）；`~/.qwen/skills/`（个人） | `.qwen/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.qwen/skills`) |
| Command | https://qwenlm.github.io/qwen-code-docs/en/users/features/commands/ | Custom Commands 小节：项目 `.qwen/commands/`；用户 `~/.qwen/commands/`；Markdown + 可选 YAML frontmatter，旧 TOML 已弃用 | `.qwen/commands/<name>.md`；project 同名优先；子目录变为冒号 namespace |
| Sub-agent | https://qwenlm.github.io/qwen-code-docs/en/users/features/sub-agents/ | `.qwen/agents/`（项目）；`~/.qwen/agents/`（用户）；Markdown + YAML frontmatter | `.qwen/agents/<name>.md` (strategy: `copy-file`, installDir: `.qwen/agents`) |

### opencode

Homepage: https://opencode.ai/docs

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://opencode.ai/docs/mcp-servers/ | 项目 `opencode.json` / `opencode.jsonc`，用户 `~/.config/opencode/opencode.json`；顶层 `mcp` | local server 用 `type: "local"`、`command: [exe, ...args]`、`environment`；remote 用 `type: "remote"`、`url`；不能直接复制 `mcpServers` 的 server 对象 |
| Prompt | https://opencode.ai/docs/rules | 项目级 `AGENTS.md` 在根目录；全局 `~/.config/opencode/AGENTS.md`；也支持 `CLAUDE.md` fallback | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://opencode.ai/docs/skills | `.opencode/skills/<name>/SKILL.md`（项目）；全局 `~/.config/opencode/skills/` | `.opencode/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.opencode/skills`) |
| Command | https://opencode.ai/docs/commands | `.opencode/commands/`（项目）；全局 `~/.config/opencode/commands/`；Markdown + YAML frontmatter | `.opencode/commands/<name>.md` (strategy: `copy-file`, installDir: `.opencode/commands`) |
| Sub-agent | https://opencode.ai/docs/agents | `.opencode/agents/`（项目）或 `~/.config/opencode/agents/`；Markdown + YAML frontmatter | `.opencode/agents/<name>.md` (strategy: `copy-file`, installDir: `.opencode/agents`) |

### Augment

Homepage: https://docs.augmentcode.com/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.augmentcode.com/cli/integrations | **Auggie CLI** 用户 `~/.augment/settings.json`；项目 `.augment/settings.json`；本地覆盖 `.augment/settings.local.json`；key `mcpServers` | 配置支持 JSONC。IDE 扩展的设置面板/Import from JSON 另见 https://docs.augmentcode.com/setup-augment/mcp ，不假设共用 CLI 文件 |
| Prompt | https://docs.augmentcode.com/setup-augment/guidelines | 用户级 `~/.augment/rules/`；工作区级 `.augment/rules/`；也支持 `AGENTS.md`/`CLAUDE.md` | `.augment/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.augment/rules`) |
| Skill | https://docs.augmentcode.com/using-augment/skills | 项目 `.augment/skills/`；用户 `~/.augment/skills/`；兼容 `.agents/skills/`、`.claude/skills/` | `.augment/skills/<name>/SKILL.md`；复制目录 bundle，尊重 host discovery 优先级 |
| Command | https://docs.augmentcode.com/using-augment/custom-commands | 用户级 `~/.augment/commands/`；工作区级 `.augment/commands/<name>.md` | `.augment/commands/<name>.md` (strategy: `copy-file`, installDir: `.augment/commands`) |
| Sub-agent | https://docs.augmentcode.com/cli/subagents | 用户级 `~/.augment/agents/`；工作区级 `.augment/agents/`；Markdown + YAML frontmatter | `.augment/agents/<name>.md` (strategy: `copy-file`, installDir: `.augment/agents`) |

### Windsurf

Homepage: https://docs.windsurf.com/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.windsurf.com/windsurf/cascade/mcp | 官方给出 home-relative `~/.codeium/windsurf/mcp_config.json`，key `mcpServers` | 目标 `~/.codeium/windsurf/mcp_config.json`；Windows 按 home 解析，不臆造 `%APPDATA%` 路径 |
| Prompt | https://docs.windsurf.com/windsurf/cascade/memories | `.windsurf/rules/*.md`，Markdown + frontmatter | `.windsurf/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.windsurf/rules`) |
| Skill | https://docs.windsurf.com/windsurf/cascade/skills | 项目 `.windsurf/skills/`；用户 `~/.codeium/windsurf/skills/`；`SKILL.md` + frontmatter（name, description） | `.windsurf/skills/<name>/SKILL.md`；用户目录不是 `~/.windsurf/skills/` |
| Command | https://docs.windsurf.com/windsurf/cascade/workflows | `.windsurf/workflows/*.md` | `.windsurf/workflows/<name>.md` (strategy: `copy-file`, installDir: `.windsurf/workflows`) |
| Sub-agent | — | 未核实独立 sub-agent 文件安装协议 | 不把内置并行能力推断成 `.windsurf/agents/` 自动发现 |

### Roo Code

Homepage: https://docs.roocode.com/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.roocode.com/features/mcp/using-mcp-in-roo | 项目级 `.roo/mcp.json`，key `mcpServers` | `.roo/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.roocode.com/features/custom-instructions | `.roo/rules/` 目录递归加载，按文件名排序；也支持 `.roo/rules-{modeSlug}/` | `.roo/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.roo/rules`) |
| Skill | https://docs.roocode.com/features/skills | 项目 `.roo/skills/`、用户 `~/.roo/skills/`，也读取 `.agents/skills/`；支持 mode-specific `.roo/skills-{modeSlug}/` | `.roo/skills/<name>/SKILL.md`，frontmatter 须含 name 和 description；完整复制目录 bundle |
| Command | https://docs.roocode.com/features/slash-commands | `.roo/commands/`，文件名即命令名（如 `review.md` → `/review`） | `.roo/commands/<name>.md` (strategy: `copy-file`, installDir: `.roo/commands`) |
| Sub-agent | https://docs.roocode.com/features/custom-modes | 自定义 modes 存在于 `.roomodes` / `custom_modes.yaml`，不是可直接复制的独立 sub-agent Markdown 协议 | 本次不把 mode 配置等同于 Sub-agent asset；不要创建未经证实的 `.roo/agents/` |

### Kiro

Homepage: https://kiro.dev/docs/

Scope: current docs cover **IDE 1.0 / CLI V3**. CLI 2.x JSON agent settings have migration differences; do not treat all Kiro versions as interchangeable.

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://kiro.dev/docs/mcp/configuration/ | 工作区 `.kiro/settings/mcp.json`，用户级 `~/.kiro/settings/mcp.json`，key `mcpServers` | `.kiro/settings/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://kiro.dev/docs/steering/ | 项目 `.kiro/steering/`，用户 `~/.kiro/steering/`；也加载 `AGENTS.md`；支持 inclusion frontmatter | `.kiro/steering/<name>.md`；自定义 agent 需用 `resources` 显式包含，如 `file://.kiro/steering/**/*.md` |
| Skill | https://kiro.dev/docs/skills/ | `.kiro/skills/<name>/SKILL.md` 或 `~/.kiro/skills/` | 默认 agent 自动发现；自定义 agent 需 `resources` 中的 `skill://` URI，不是复制后必然可用 |
| Command | https://kiro.dev/docs/skills/ ; https://kiro.dev/docs/steering/ | Skills 和 manual/auto steering 可作为 slash commands 调用 | 复用 Skill/Prompt 协议；未确认独立 `.kiro/commands/` 目录 |
| Sub-agent | https://kiro.dev/docs/custom-agents/configuration-reference/ ; https://kiro.dev/docs/custom-agents/subagents/ | 工作区 `.kiro/agents/` 或用户 `~/.kiro/agents/`；当前格式支持 Markdown frontmatter + prompt body | `.kiro/agents/<name>.md`；记录版本和 `resources`/`includeMcpJson` 行为，旧 JSON 用 `/upgrade-agent` 迁移 |

### Codex CLI

Homepage: https://github.com/openai/codex

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://developers.openai.com/codex/mcp | 全局 `~/.codex/config.toml`，项目级 `.codex/config.toml`；TOML table `[mcp_servers.<server-name>]` | macOS/Linux: `~/.codex/config.toml` (TOML table format: `[mcp_servers.<name>]`); Windows: `%USERPROFILE%\.codex\config.toml` |
| Prompt | https://developers.openai.com/codex/guides/agents-md | `AGENTS.md` 在仓库根目录及子目录；全局 `~/.codex/AGENTS.md` | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://developers.openai.com/codex/skills | 项目从 cwd 到仓库根逐级查找 `.agents/skills/`；用户 `$HOME/.agents/skills/`，另有 admin `/etc/codex/skills/` | `.agents/skills/<name>/SKILL.md`；旧 `.codex/skills/` 不再作为当前官方推荐路径；含 name/description frontmatter |
| Command | https://developers.openai.com/codex/custom-prompts | 已弃用的 custom prompts 位于 `~/.codex/prompts/*.md`，不通过仓库共享；官方推荐 skills | 保留 legacy 信息，不写成“从不支持文件命令”，也不新增项目级 `.codex/commands/` |
| Sub-agent | https://developers.openai.com/codex/subagents | 独立 TOML 文件，`~/.codex/agents/`（个人）或 `.codex/agents/`（项目），须含 name/description/developer_instructions | `.codex/agents/<name>.toml` (strategy: `copy-file`, installDir: `.codex/agents`) |

### Tabnine CLI

Homepage: https://docs.tabnine.com/

Scope: the MCP and guidelines sources describe **Tabnine IDE Agent**; the command source describes **Tabnine CLI**. Cross-client discovery has not been runtime-verified.

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.tabnine.com/main/getting-started/tabnine-agent/mcp-intro-and-setup | `.tabnine/mcp_servers.json`（项目级或 home），key `mcpServers` | `.tabnine/mcp_servers.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.tabnine.com/main/getting-started/tabnine-agent/guidelines | `$PROJECT/.tabnine/guidelines/` 或 `~/.tabnine/guidelines/`，Markdown 格式 | `.tabnine/guidelines/<name>.md` (strategy: `create-file-in-dir`, installDir: `.tabnine/guidelines`) |
| Skill | — | 本次未找到足以确认 CLI skill 自动发现目录的官方协议 | 不根据第三方列表声明支持或断言产品绝无 skills |
| Command | https://docs.tabnine.com/main/getting-started/tabnine-cli/features/commands | 用户 `~/.tabnine/agent/commands/`；项目 `.tabnine/agent/commands/`；**TOML**，`prompt` + 可选 `description` | `.tabnine/agent/commands/<name>.toml`；嵌套目录形成 `/namespace:command`；旧文档链接已失效 |
| Sub-agent | — | 未核实独立 CLI sub-agent 文件协议 | 不推断 `.tabnine/agents/` |

### Kimi Code

Homepage: https://moonshotai.github.io/kimi-cli/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://moonshotai.github.io/kimi-cli/en/customization/mcp.html | `~/.kimi/mcp.json`，key `mcpServers`，格式兼容其他 MCP 客户端 | macOS/Linux: `~/.kimi/mcp.json` → key `mcpServers`; Windows: `%USERPROFILE%\.kimi\mcp.json` → key `mcpServers` |
| Prompt | https://moonshotai.github.io/kimi-cli/en/customization/agents.html | `${KIMI_AGENTS_MD}` 变量合并项目根到工作目录的 `AGENTS.md`（含 `.kimi/AGENTS.md`） | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://moonshotai.github.io/kimi-cli/en/customization/skills.html | 项目/用户 `.kimi/skills/`、`.agents/skills/`；兼容 `.claude/skills/`、`.codex/skills/` 等；同名优先级见官方文档 | `.kimi/skills/<name>/SKILL.md` + YAML frontmatter；兼容路径只证明 Kimi 的 discovery，不证明 Codex 仍推荐旧路径 |
| Command | https://moonshotai.github.io/kimi-cli/en/customization/skills.html | 官方描述通过 slash command 加载 skill；不是独立 commands 文件目录 | 复用 Skill 协议，不凭空创建 `.kimi/commands/` |
| Sub-agent | https://moonshotai.github.io/kimi-cli/en/customization/agents.html | YAML `version: 1` / `agent`；父 agent 的 `subagents.<name>` 含 `path`、`description`，指向子 agent YAML；可用 `system_prompt_path` 引用 Markdown | 需安装 YAML + prompt 依赖并注册父 agent，用 `kimi --agent-file <parent.yaml>` 加载；未确认 `.kimi/agents/` 自动发现，不能只 copy 一个 `.md` |

### Trae

Homepage: https://docs.trae.ai/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.trae.ai/ide/add-mcp-servers | 项目 `.trae/mcp.json`，key `mcpServers`；须在 Settings > MCP 启用 **Project MCP** | `.trae/mcp.json` → key `mcpServers`；单独写文件不绕过用户信任/启用步骤 |
| Prompt | https://docs.trae.ai/ide/rules | `.trae/rules/` 目录，每条规则为 `.md` 文件 + YAML frontmatter（alwaysApply, description, globs）；也兼容 AGENTS.md | `.trae/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.trae/rules`) |
| Skill | https://docs.trae.ai/ide/skills | `.trae/skills/{skill_name}/SKILL.md`（项目），`~/.trae/skills`（全局）；YAML frontmatter（name, description） | `.trae/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.trae/skills`) |
| Command | — | 未核实独立自定义 slash-command 文件协议 | 不把内置 slash 菜单等同于文件自动发现 |
| Sub-agent | — | 本次未核实可安装的独立 sub-agent 文件协议 | UI 中的自定义 agent 不足以证明存在 `.trae/agents/` 协议 |

### OpenClaw

Homepage: https://docs.openclaw.ai/

Scope: paths are relative to the **configured agent workspace**, by default `~/.openclaw/workspace`, not necessarily the current repository. The old third-party `openclawlab.com` reference and a historical closed issue are not authoritative evidence of current capabilities.

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.openclaw.ai/gateway/config-extensions ; https://docs.openclaw.ai/gateway/configuration | 原生 managed MCP 定义位于 JSON5 `~/.openclaw/openclaw.json` 的 `mcp.servers`，供 embedded OpenClaw 和其他 runtime adapters 使用 | 支持 stdio/remote server；需 JSON5-aware **嵌套对象合并**。不是 `mcpServers`，也不是把 OpenClaw 自身暴露成 MCP server 的 `mcp serve` 功能 |
| Prompt | https://docs.openclaw.ai/concepts/agent-workspace | `<workspace>/AGENTS.md` 是 agent 工作区的行为指令 | 默认 `~/.openclaw/workspace/AGENTS.md`；先解析 workspace，不能盲写 cwd 的 `AGENTS.md` |
| Skill | https://docs.openclaw.ai/tools/skills | `<workspace>/skills/`；managed `~/.openclaw/skills/`；也读取 workspace `.agents/skills/` 和用户 `~/.agents/skills/`（受 state 配置限制） | `<workspace>/skills/<name>/SKILL.md`；默认 `~/.openclaw/workspace/skills/<name>/SKILL.md`；不是 `<cwd>/.openclaw/skills/` |
| Command | https://docs.openclaw.ai/tools/skills ; https://docs.openclaw.ai/tools/slash-commands | Skill 的名称可暴露为 slash command | 复用 Skill 安装；不推断 `.openclaw/commands/` |
| Sub-agent | — | 多 agent/runtime 配置不等于独立 sub-agent 文件自动发现 | 本次未确认可以 drop-in 安装的独立文件目录，保留未核实状态 |

### Mistral Vibe

Homepage: https://docs.mistral.ai/vibe/code/cli/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.mistral.ai/vibe/code/cli/configuration ; https://docs.mistral.ai/vibe/code/cli/configuration-reference | `.vibe/config.toml` 或 `~/.vibe/config.toml`；`[[mcp_servers]]` 数组；每项需 `name`、`transport`，其余字段取决于 transport | `.vibe/config.toml`；保留 TOML array-of-tables，不可与 Codex 的 `[mcp_servers.<name>]` 混用 |
| Prompt | https://docs.mistral.ai/vibe/code/cli/agents | 用户 `~/.vibe/AGENTS.md`；可信工作区中 cwd 到 trusted root 的各层 `AGENTS.md` | `AGENTS.md` in project root；尊重 trusted-folder 边界 |
| Skill | https://docs.mistral.ai/vibe/code/cli/skills | 项目 `.vibe/skills/` / `.agents/skills/`；用户 `~/.vibe/skills/` / `~/.agents/skills/` | `.vibe/skills/<name>/SKILL.md`，YAML frontmatter；项目 discovery 需要 trust |
| Command | https://docs.mistral.ai/vibe/code/cli/skills | Skill 默认 `user-invocable: true`，以 `/skill-name` 调用；支持 `disable-model-invocation` | 复用 Skill 目录，不创建未经文档确认的 `.vibe/commands/` |
| Sub-agent | https://docs.mistral.ai/vibe/code/cli/agents | 项目 `.vibe/agents/<name>.toml` 或用户 `~/.vibe/agents/<name>.toml`；`agent_type = "subagent"`、`description`；`system_prompt_id` 可引用 `.vibe/prompts/<id>.md` | 需生成 TOML 并处理 prompt 依赖；普通 `agent_type = "agent"` 不是 delegation-only subagent |

### Claude Desktop

Homepage: https://claude.com/download/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://modelcontextprotocol.io/docs/develop/connect-local-servers ; https://claude.com/download/ | macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`；Windows: `%APPDATA%\Claude\claude_desktop_config.json`；key `mcpServers` | Linux beta 已发布，但所引 MCP 教程未明确 Linux 路径；可通过 Settings > Developer > Edit Config 定位实际文件，不能把未知路径当作产品不支持 |
| Prompt | — | 未核实自动发现的项目规则文件 | UI project instructions 不等于项目根目录文件协议 |
| Skill | https://support.claude.com/en/articles/12512180-using-skills-in-claude | 支持自定义 Skill：打包 skill 目录为 ZIP，通过 UI 上传（受账户能力/设置限制） | 产品支持 skills，但不是 copy 到项目 skill 目录；本 installer 的文件写入模型不能直接声称支持 |
| Command | — | 未核实独立命令文件安装协议 | 不与 Claude Code 的 `.claude/commands/` 混淆 |
| Sub-agent | — | 未核实独立 sub-agent 文件安装协议 | 不与 Claude Code 的 `.claude/agents/` 混淆 |

---

## New Host Candidates (Not Implemented)

These are **proposed future adapters**, not additions to the current registry. IDs below are provisional. Prioritize Factory Droid (five explicit file contracts), then Cline, Amp and Antigravity; Continue still needs protocol clarification for some assets. This is not an exhaustive list of AI products.

| Candidate | Proposed ID | MCP | Prompt | Skill | Command | Sub-agent |
|-----------|-------------|-----|--------|-------|---------|-----------|
| Factory Droid | `droid` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cline | `cline` | ✅ | ✅ | ✅ | ↪ | ? |
| Amp (CLI) | `amp` | ✅ | ✅ | ✅ | — | — |
| Google Antigravity | `antigravity` | ✅ | ✅ | ✅ | ↪ (migration) | — |
| Continue | `continue` | ✅ | ✅ | ? | ↪ | ? |

`?` means the precise installable protocol is not yet verified. Do not implement those cells by guessing a conventional directory.

### Factory Droid (Candidate)

| Asset Type | Official Source | Verified Contract / Proposed Target |
|------------|-----------------|-------------------------------------|
| MCP | https://docs.factory.ai/harness/mcp | 项目 `.factory/mcp.json`、用户 `~/.factory/mcp.json`；顶层 `mcpServers`；项目同名配置优先；保留 transport-specific type/command/url 字段 |
| Prompt | https://docs.factory.ai/harness/agents-md | `AGENTS.md`，项目及子树作用域；未来可用 project-root `AGENTS.md` + marker append，不能覆盖已有团队说明 |
| Skill | https://docs.factory.ai/harness/skills | 项目 `.factory/skills/<name>/SKILL.md`、用户 `~/.factory/skills/`；目录 bundle + YAML frontmatter（name, description） |
| Command | https://docs.factory.ai/harness/custom-slash-commands | 项目 `.factory/commands/<name>.md`、用户 `~/.factory/commands/`；也支持可执行脚本（未来 adapter 必须处理权限/平台差异，不能仅改后缀） |
| Sub-agent | https://docs.factory.ai/harness/subagents | 项目 `.factory/droids/<name>.md`、用户 `~/.factory/droids/`；Markdown + YAML frontmatter；project 同名优先；只扫描第一层，不能用 `.factory/agents/` 替代 |

### Cline (Candidate)

Scope: the current [configuration layout](https://docs.cline.bot/getting-started/config) consolidates global/project directories. MCP still needs a CLI vs IDE distinction.

| Asset Type | Official Source | Verified Contract / Open Question |
|------------|-----------------|-----------------------------------|
| MCP | https://docs.cline.bot/mcp/mcp-overview | CLI `~/.cline/data/settings/cline_mcp_settings.json`（可由 `CLINE_MCP_SETTINGS_PATH` 覆盖），key `mcpServers`；IDE 使用 Configure MCP Servers 打开的实际文件；HTTP 需 `type: "streamableHttp"`，不是照抄其他 client 的 transport 名 |
| Prompt | https://docs.cline.bot/customization/cline-rules | `.cline/rules/` 或 `.clinerules/`；用户 `~/.cline/rules/`；另支持 project `AGENTS.md`；新 host-specific 目标可用 `.cline/rules/<name>.md` |
| Skill | https://docs.cline.bot/customization/skills | `.cline/skills/<name>/SKILL.md`、`~/.cline/skills/`；兼容 `.clinerules/skills/`、`.agents/skills/`；当前文档说明 global 同名 skill 优先于 project，不能套用其他 host 的优先级 |
| Command | https://docs.cline.bot/core-workflows/using-commands ; https://docs.cline.bot/getting-started/config | 可通过 slash command 调用启用的 skill。另已确认 `.cline/workflows/`、`~/.cline/workflows/` 目录，但独立 workflow schema 需补证；暂用 Skill 协议，不推断 command 文件格式 |
| Sub-agent | https://docs.cline.bot/features/subagents ; https://docs.cline.bot/getting-started/config | CLI/Desktop 支持 subagents（IDE extensions 不支持）；配置布局列出 `.cline/agents/`，但未在所引页面定义 entry format / 必填字段；在精确协议得到验证前不推断为 `.md` drop-in |

### Amp (Candidate)

Scope: **Amp CLI** configuration, not hosted MCP definitions stored by ampcode.com or arbitrary editor settings.

| Asset Type | Official Source | Verified Contract / Open Question |
|------------|-----------------|-----------------------------------|
| MCP | https://ampcode.com/docs/cli/settings ; https://ampcode.com/docs/customize/mcp | 项目 `.amp/settings.json` / `.jsonc`，用户 `~/.config/amp/settings.json` / `.jsonc`；**字面量 key** `"amp.mcpServers"`，不是嵌套 `amp` 对象；支持 command/args/env 或 url/headers |
| Prompt | https://ampcode.com/docs/customize/agents-md | cwd、父目录、子树的 `AGENTS.md`；个人 `~/.config/amp/AGENTS.md` / `~/.config/AGENTS.md`；未来目标 project-root `AGENTS.md` |
| Skill | https://ampcode.com/docs/customize/skills | 项目 `.agents/skills/`；个人首选 `~/.config/agents/skills/`，也读取 `~/.agents/skills/`、`~/.config/amp/skills/`；禁用全局兼容目录的设置会影响 discovery |
| Command | — | 未核实独立 command 文件自动发现协议；不猜测 `.amp/commands/` |
| Sub-agent | — | 内置委派能力不是独立 asset 文件协议；未核实 custom sub-agent 的安装格式 |

### Google Antigravity (Candidate)

| Asset Type | Official Source | Verified Contract / Open Question |
|------------|-----------------|-----------------------------------|
| MCP | https://antigravity.google/docs/mcp/ | 项目 `.agents/mcp_config.json`，用户 `~/.gemini/config/mcp_config.json`；顶层 `mcpServers`；不同 transport 字段需遵循该产品 schema |
| Prompt | https://antigravity.google/docs/rules/ | 项目 `AGENTS.md` / `GEMINI.md`，或 `.agents/rules/*.md`；模块化规则需合法 YAML frontmatter + trigger，缺失会被忽略；未来优先选定 `AGENTS.md`，不用无 frontmatter 的模块化规则 |
| Skill | https://antigravity.google/docs/skills/ | 项目 `.agents/skills/<name>/SKILL.md`；全局 `~/.gemini/config/skills/`；旧 `.agent/skills/` 向后兼容；区分 App / IDE / CLI 额外 discovery 路径 |
| Command | https://antigravity.google/docs/ide/workflows/ | 官方公告旧 Workflows 于 **2026-10-19** 停用，建议迁移 Agent skills；本次核查日期晚于停用日，不把旧 `.agent/workflows/` 写成新 adapter 的可用目标 |
| Sub-agent | — | 未核实独立 sub-agent 文件安装协议，不把多 agent UI 工作流当作磁盘格式 |

### Continue (Candidate)

| Asset Type | Official Source | Verified Contract / Open Question |
|------------|-----------------|-----------------------------------|
| MCP | https://docs.continue.dev/customize/deep-dives/mcp | 项目 `.continue/mcpServers/` 可放独立 YAML block（需 name/version/schema），也可放兼容 JSON MCP config（key `mcpServers`）；主 `config.yaml` 的 `mcpServers` 是列表，不是同一种 JSON map |
| Prompt | https://docs.continue.dev/customize/deep-dives/rules | `.continue/rules/<name>.md`，推荐 Markdown + YAML frontmatter；也支持 config YAML rules；明确选择格式后再实现 |
| Skill | — | 本次未核实 Continue client 的 `SKILL.md` 自动发现协议；Continue 发布供其他 agent 使用的 skills 不足以证明 client 自己读取它们 |
| Command | https://docs.continue.dev/customize/deep-dives/prompts | Markdown `invokable: true` 暴露为 slash prompt；也可在 `config.yaml` 的 `prompts` 引用 Hub block；需进一步固定本地发现/注册方式，不能推断 `.continue/commands/` |
| Sub-agent | — | 未核实独立 custom sub-agent 文件安装协议；checks 通过外部 coding agent 的 skill 运行，不等于 Continue host 的 Sub-agent asset |

Other clients (for example Goose, Zed, OpenHands and Pi) are **not declared unsupported** by their omission. Add a candidate only after verifying its exact file protocol, client surface and scope from official sources.

---

## How to Add a New Host (Contribution Guide)

1. **Documentation first:** verify official sources and add a candidate section with proposed ID, client/version scope, project/user paths, config keys, schema, required metadata and unresolved questions. Do not add it to the registered-adapter matrix yet.
2. In a separate implementation change, create `src/hosts/<id>.ts` implementing `HostAdapter` from `types.ts`, then register it in `src/hosts/index.ts`.
3. Ensure each supported asset type has a valid `writeStrategy` **and format handling**: convert MCP schemas, preserve JSONC/JSON5/TOML, copy full skill bundles, generate frontmatter and register dependent files where required. A config key alone is not a transport schema.
4. Do not force skills-as-commands, custom modes, uploaded ZIPs or parent-registered agents into independent Markdown asset directories. If the model cannot represent a contract yet, use `NOT_SUPPORTED(reason)` with a precise explanation and document the gap.
5. Add `tests/unit/hosts/<id>.test.ts` for adapter metadata and supported capabilities, then verify actual discovery/behavior before moving a candidate into the registered matrix. Cover client/version and OS differences; detection paths are hints, not proof of an installed client or supported capability.
6. Keep source links, verification date and known adapter gaps current. Never promote third-party path guesses or historical "not planned" issues above current official documentation.
