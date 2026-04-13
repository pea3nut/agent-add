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

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://cursor.com/docs/context/mcp | (未知) — 页面返回 429 速率限制，无法访问 | `.cursor/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://cursor.com/docs/context/rules | (未知) — 页面返回 429 速率限制，无法访问 | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://cursor.com/docs/context/skills | (未知) — 页面返回 429 速率限制，无法访问 | `.cursor/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://cursor.com/docs/context/commands | (未知) — 页面返回 429 速率限制，无法访问 | `.cursor/commands/<name>.md` (strategy: `copy-file`) |
| Sub-agent | https://cursor.com/docs/chat/subagents | (未知) — 页面返回 429 速率限制，无法访问 | `.cursor/agents/<name>.md` (strategy: `copy-file`) |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://cursor.com/docs/context/mcp | (未知) — 页面返回 429 速率限制，无法访问 | `~/.cursor/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | ❌ | ❌ | Cursor does not support global prompt installation. |
| Skill | https://cursor.com/docs/context/skills | (未知) — 页面返回 429 速率限制，无法访问 | `~/.cursor/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | ❌ | ❌ | Cursor does not support global command installation. |
| Sub-agent | https://cursor.com/docs/chat/subagents | (未知) — 页面返回 429 速率限制，无法访问 | `~/.cursor/agents/<name>.md` (strategy: `copy-file`) |

### Claude Code

Homepage: https://code.claude.com/docs/en

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://code.claude.com/docs/en/mcp | "The resulting `.mcp.json` file follows a standardized format: `{ \"mcpServers\": { \"shared-server\": { ... } } }`. Project scope: `.mcp.json` in project root." | `.mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://code.claude.com/docs/en/memory | "Project instructions: `./CLAUDE.md` or `./.claude/CLAUDE.md` — Team-shared instructions for the project." | `CLAUDE.md` in project root (strategy: `append-with-marker`) |
| Skill | https://code.claude.com/docs/en/slash-commands | "Project: `.claude/skills/<skill-name>/SKILL.md` — Applies to: This project only." | `.claude/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://code.claude.com/docs/en/slash-commands | (未知) — `/slash-commands` 页面重定向至 skills 文档，未找到 `.claude/commands/` 的原文说明 | `.claude/commands/<name>.md` (strategy: `copy-file`) |
| Sub-agent | https://code.claude.com/docs/en/sub-agents | "`.claude/agents/` — Current project (Priority: 3)." | `.claude/agents/<name>.md` (strategy: `copy-file`) |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://code.claude.com/docs/en/mcp | "Local scope: `~/.claude.json`. User scope: `~/.claude.json` — All your projects." | `~/.claude.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://code.claude.com/docs/en/memory | "User instructions: `~/.claude/CLAUDE.md` — Personal preferences for all projects." | `~/.claude/CLAUDE.md` (strategy: `append-with-marker`) |
| Skill | https://code.claude.com/docs/en/slash-commands | "Personal: `~/.claude/skills/<skill-name>/SKILL.md` — Applies to: All your projects." | `~/.claude/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | ❌ | ❌ | Claude Code does not support global command installation. |
| Sub-agent | https://code.claude.com/docs/en/sub-agents | "`~/.claude/agents/` — All your projects (Priority: 4)." | `~/.claude/agents/<name>.md` (strategy: `copy-file`) |

### GitHub Copilot

Homepage: https://docs.github.com/en/copilot

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.github.com/en/copilot/customizing-copilot/using-model-context-protocol/extending-copilot-chat-with-mcp | "Visual Studio Code repository-level: `.vscode/mcp.json` in your project root. Format: `{ \"servers\": { \"name\": { \"command\": \"executable\", \"args\": [...] } } }`" | `.vscode/mcp.json` → key `servers` (strategy: `inject-json-key`) |
| Prompt | https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot | "Version repository-range instructions: `.github/copilot-instructions.md` at the repository root. Agent instructions: `AGENTS.md` files (with the nearest one taking precedence)." | `.github/copilot-instructions.md` (strategy: `append-with-marker`) |
| Skill | https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-skills | "Agent skills require a `SKILL.md` file stored in `.github/skills/` for repository-specific skills. Each skill needs its own subdirectory with lowercase, hyphen-separated names. `name` (required), `description` (required)." | `.github/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://docs.github.com/en/copilot/tutorials/customization-library/prompt-files/your-first-prompt-file | "Storage location: `.github/prompts/` folder. Naming convention: `filename.prompt.md`. Frontmatter: `agent`, `description`." | `.github/prompts/<name>.prompt.md` (strategy: `copy-file`) |
| Sub-agent | https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents | "Repository-level: `.github/agents/` directory. Files must follow the naming convention: `{name}.agent.md`. Key frontmatter: `name`, `description` (required), `tools`, `mcp-servers`, `model`." | `.github/agents/<name>.agent.md` (strategy: `copy-file`) |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | ❌ | ❌ | GitHub Copilot does not support global MCP installation. |
| Prompt | ❌ | ❌ | GitHub Copilot does not support global prompt installation. |
| Skill | ❌ | ❌ | GitHub Copilot does not support global skill installation. |
| Command | ❌ | ❌ | GitHub Copilot does not support global command installation. |
| Sub-agent | ❌ | ❌ | GitHub Copilot does not support global sub-agent installation. |

### Gemini CLI

Homepage: https://google-gemini.github.io/gemini-cli/

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html | "User-level: `~/.gemini/settings.json`. Project-level: `.gemini/settings.json`. Key `mcpServers`." | `.gemini/settings.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html | "Global location: `~/.gemini/GEMINI.md`. Project-level: current working directory and its parent directories (up to .git folder). Default filename: `GEMINI.md`. Customizable via `context.fileName` in settings.json: `[\"AGENTS.md\", \"CONTEXT.md\", \"GEMINI.md\"]`." | `GEMINI.md` in project root (strategy: `append-with-marker`) |
| Skill | https://geminicli.com/docs/cli/skills/ | "Workspace: `.gemini/skills/` or `.agents/skills/`. User: `~/.gemini/skills/` or `~/.agents/skills/`. Each skill needs a `SKILL.md` as the primary instructions document." | `.gemini/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://google-gemini.github.io/gemini-cli/docs/cli/custom-commands.html | "Global commands: `~/.gemini/commands/`. Project commands: `<project-root>/.gemini/commands/`. File format: TOML. Required field: `prompt`. Optional: `description`." | `.gemini/commands/<name>.toml` (strategy: `copy-file`) |
| Sub-agent | https://geminicli.com/docs/core/subagents/ | "Location: `.gemini/agents/*.md` (project) or `~/.gemini/agents/*.md` (user). Format: YAML frontmatter + Markdown. Required frontmatter: `name`, `description`, `tools`." | `.gemini/agents/<name>.md` (strategy: `copy-file`) |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html | "User-level: `~/.gemini/settings.json`. Key `mcpServers`." | `~/.gemini/settings.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html | "Global location: `~/.gemini/GEMINI.md`." | `~/.gemini/GEMINI.md` (strategy: `append-with-marker`) |
| Skill | https://geminicli.com/docs/cli/skills/ | "User: `~/.gemini/skills/` or `~/.agents/skills/`." | `~/.gemini/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://google-gemini.github.io/gemini-cli/docs/cli/custom-commands.html | "Global commands: `~/.gemini/commands/`." | `~/.gemini/commands/<name>.toml` (strategy: `copy-file`) |
| Sub-agent | https://geminicli.com/docs/core/subagents/ | "User-level: `~/.gemini/agents/*.md`." | `~/.gemini/agents/<name>.md` (strategy: `copy-file`) |

### Kilo Code

Homepage: https://kilo.ai/docs

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://kilo.ai/docs/automate/mcp/using-in-kilo-code | "Project-level Configuration: `./kilo.json` or `./.kilo/kilo.json`. Format: `{ \"mcp\": { \"server-name\": { \"type\": \"local\", \"command\": [...] } } }`. Key: `mcp`." | `.kilo/kilo.json` → key `mcp` (strategy: `inject-json-key`); backward compatible path: `.kilocode/mcp.json` → key `mcpServers` |
| Prompt | https://kilo.ai/docs/customize/custom-rules | "Project Rules: directory `.kilo/rules/` (recommended). Backward compatible with `.kilocode/rules/`. Referenced via `kilo.jsonc` `instructions` field: `[\".kilo/rules/*.md\"]`." | `.kilo/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.kilo/rules`); backward compatible: `.kilocode/rules` |
| Skill | https://kilo.ai/docs/customize/skills | "Project Skills: `.kilo/skills/` within your project root directory. Also recognizes `.claude/skills/` and `.agents/skills/` for interoperability. Each skill requires a `SKILL.md` file. Required fields: `name` (64 chars max), `description` (1024 chars max). The `name` field must match the parent directory name exactly." | `.kilo/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.kilo/skills`); backward compatible: `.kilocode/skills` |
| Command | https://kilo.ai/docs/customize/workflows | "Project-specific commands: `[project]/.kilo/commands/`. File format: Markdown (.md). The system invokes commands using only the filename without the extension." | `.kilo/commands/<name>.md` (strategy: `copy-file`, installDir: `.kilo/commands`); backward compatible: `.kilocode/commands` |
| Sub-agent | https://kilo.ai/docs/customize/custom-subagents | "Project-Specific: `.kilo/agents/` for markdown files. The filename becomes the agent identifier. Use YAML frontmatter for configuration metadata." | `.kilo/agents/<name>.md` (strategy: `copy-file`, installDir: `.kilo/agents`); backward compatible: `.kilocode/agents` |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://kilo.ai/docs/automate/mcp/using-in-kilo-code | "Global Configuration: `~/.config/kilo/kilo.json` (recommended). Also supports `kilo.jsonc`, `opencode.json`, `opencode.jsonc`, and `config.json`. Key: `mcp`." | `~/.config/kilo/kilo.json` → key `mcp` (strategy: `inject-json-key`) |
| Prompt | https://kilo.ai/docs/customize/custom-rules | "Global Rules: `~/.config/kilo/kilo.jsonc`. Legacy location: `~/.kilocode/rules/`." | `~/.config/kilo/kilo.jsonc` references rules; no dedicated global rules installDir |
| Skill | https://kilo.ai/docs/customize/skills | "Global Skills (User-Level): Mac/Linux: `~/.kilo/skills/`. Windows: `\Users\<yourUser>\.kilo\skills\`." | `~/.kilo/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://kilo.ai/docs/customize/workflows | "Global commands: `~/.config/kilo/commands/` (available across all projects)." | `~/.config/kilo/commands/<name>.md` (strategy: `copy-file`) |
| Sub-agent | https://kilo.ai/docs/customize/custom-subagents | "Global Configuration: `~/.config/kilo/agents/` for markdown files." | `~/.config/kilo/agents/<name>.md` (strategy: `copy-file`) |

### Qwen Code

Homepage: https://qwenlm.github.io/qwen-code-docs/en/

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/ | "Project-level config: `.qwen/settings.json` in your project root. User-level config: `~/.qwen/settings.json`. Key: `mcpServers`." | `.qwen/settings.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://qwenlm.github.io/qwen-code-docs/en/users/configuration/settings/ | "Context file names: configurable via `context.fileName` in `settings.json`. Default search includes `AGENTS.md` (priority) and `QWEN.md`." | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/ | "Personal skills: `~/.qwen/skills/`. Project skills: `.qwen/skills/` within your project. Required YAML frontmatter: `name` (lowercase, numbers, hyphens), `description`." | `.qwen/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.qwen/skills`) |
| Command | https://qwenlm.github.io/qwen-code-docs/en/users/features/commands/ | "Project-level: `<project root>/.qwen/commands/` (takes precedence over global). Markdown with optional YAML frontmatter. TOML format is deprecated." | `.qwen/commands/<name>.md` (strategy: `copy-file`, installDir: `.qwen/commands`) |
| Sub-agent | https://qwenlm.github.io/qwen-code-docs/en/users/features/sub-agents/ | "Project-level: `.qwen/agents/` (highest priority). YAML frontmatter with `name`, `description`, `tools` array, followed by system prompt." | `.qwen/agents/<name>.md` (strategy: `copy-file`, installDir: `.qwen/agents`) |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | ❌ | ❌ | Qwen Code does not support global MCP installation. |
| Prompt | ❌ | ❌ | Qwen Code does not support global prompt installation. |
| Skill | https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/ | "Personal skills: `~/.qwen/skills/`." | `~/.qwen/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://qwenlm.github.io/qwen-code-docs/en/users/features/commands/ | "Global: `~/.qwen/commands/`." | `~/.qwen/commands/<name>.md` (strategy: `copy-file`) |
| Sub-agent | https://qwenlm.github.io/qwen-code-docs/en/users/features/sub-agents/ | "User-level: `~/.qwen/agents/` (fallback option)." | `~/.qwen/agents/<name>.md` (strategy: `copy-file`) |

### opencode

Homepage: https://opencode.ai/docs

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://opencode.ai/docs/config | "Project config: `opencode.json` in project root. Key: `mcp`. Format: `{ \"mcp\": { \"server-name\": { ... } } }`." | `opencode.json` → key `mcp` (strategy: `inject-json-key`) |
| Prompt | https://opencode.ai/docs/rules | "Project-level: Place `AGENTS.md` in your project root for project-specific rules. Legacy support: OpenCode recognizes `CLAUDE.md` (project) as fallback for Claude Code users." | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://opencode.ai/docs/skills | "Project: `.opencode/skills/<name>/SKILL.md`. Required YAML frontmatter: `name` (1–64 chars, lowercase alphanumeric + hyphens), `description` (1–1024 chars)." | `.opencode/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.opencode/skills`) |
| Command | https://opencode.ai/docs/commands | "Per-project: `.opencode/commands/`. Markdown format with optional YAML frontmatter: `description`, `agent`, `model`, `subtask`." | `.opencode/commands/<name>.md` (strategy: `copy-file`, installDir: `.opencode/commands`) |
| Sub-agent | https://opencode.ai/docs/agents | "Per-project: `.opencode/agents/`. YAML frontmatter: `description` (required), `mode` (must be `subagent`), `model`, `temperature`, `permission`." | `.opencode/agents/<name>.md` (strategy: `copy-file`, installDir: `.opencode/agents`) |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | ❌ | ❌ | opencode does not support global MCP installation. |
| Prompt | https://opencode.ai/docs/rules | "Global: Store rules at `~/.config/opencode/AGENTS.md` for personal guidelines applied across all sessions." | `~/.config/opencode/AGENTS.md` (strategy: `append-with-marker`) |
| Skill | https://opencode.ai/docs/skills | "Global: `~/.config/opencode/skills/<name>/SKILL.md`." | `~/.config/opencode/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://opencode.ai/docs/commands | "Global: `~/.config/opencode/commands/`." | `~/.config/opencode/commands/<name>.md` (strategy: `copy-file`) |
| Sub-agent | https://opencode.ai/docs/agents | "Global: `~/.config/opencode/agents/`." | `~/.config/opencode/agents/<name>.md` (strategy: `copy-file`) |

### Augment

Homepage: https://docs.augmentcode.com/

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.augmentcode.com/setup-augment/mcp | "When configuring locally via JSON, use this structure: `{ \"mcpServers\": { \"ServerName\": { \"command\": \"...\", \"args\": [...] } } }`." | macOS/Linux: `~/.augment/settings.json` → key `mcpServers`; Windows: `%USERPROFILE%\.augment\settings.json` → key `mcpServers` |
| Prompt | https://docs.augmentcode.com/setup-augment/guidelines | "Workspace Rules: `<workspace_root>/.augment/rules/` (project-specific). Rules are markdown files (`.md` or `.mdx` extensions) with optional frontmatter." | `.augment/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.augment/rules`) |
| Skill | https://docs.augmentcode.com/using-augment/skills | "Skills are organized in directories with a `SKILL.md` file: `.augment/skills/skill-name/SKILL.md`. Required frontmatter: `name` (1–64 chars, lowercase alphanumeric + hyphens), `description` (1–1024 chars). Also compatible with `.claude/skills/` and `.agents/skills/`." | `.augment/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.augment/skills`) |
| Command | https://docs.augmentcode.com/using-augment/custom-commands | "Workspace scope: `.augment/commands/`. Command files use Markdown (`.md`) with optional YAML frontmatter: `description`, `argument-hint`, `model`." | `.augment/commands/<name>.md` (strategy: `copy-file`, installDir: `.augment/commands`) |
| Sub-agent | https://docs.augmentcode.com/cli/subagents | "Workspace-level: `./.augment/agents/` (available only in current workspace). YAML frontmatter: `name` (required), `description`, `model`, `tools`, `disabled_tools`." | `.augment/agents/<name>.md` (strategy: `copy-file`, installDir: `.augment/agents`) |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.augmentcode.com/setup-augment/mcp | "When configuring locally via JSON, use this structure: `{ \"mcpServers\": { ... } }`. (File path not explicitly documented; confirmed key: `mcpServers`.)" | macOS/Linux: `~/.augment/settings.json` → key `mcpServers`; Windows: `%USERPROFILE%\.augment\settings.json` → key `mcpServers` |
| Prompt | https://docs.augmentcode.com/setup-augment/guidelines | "User Rules: `~/.augment/rules/` (applies to all workspaces)." | `~/.augment/rules/<name>.md` (strategy: `create-file-in-dir`) |
| Skill | https://docs.augmentcode.com/using-augment/skills | "Skills are found in: `~/.augment/skills/` (user-level, highest priority), then `<workspace>/.augment/skills/`." | `~/.augment/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://docs.augmentcode.com/using-augment/custom-commands | "User scope: `~/.augment/commands/` (highest priority)." | `~/.augment/commands/<name>.md` (strategy: `copy-file`) |
| Sub-agent | https://docs.augmentcode.com/cli/subagents | "User-level: `~/.augment/agents/` (available across all workspaces)." | `~/.augment/agents/<name>.md` (strategy: `copy-file`) |

### Windsurf

Homepage: https://docs.windsurf.com/

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.windsurf.com/windsurf/cascade/mcp | "File location: `~/.codeium/windsurf/mcp_config.json`. Key: `mcpServers`. The `~/.codeium/windsurf/mcp_config.json` file supports variable interpolation using `${env:VAR_NAME}` and `${file:/path/to/file}` patterns." | macOS/Linux: `~/.codeium/windsurf/mcp_config.json` → key `mcpServers`; Windows: `%APPDATA%\Codeium\windsurf\mcp_config.json` → key `mcpServers` |
| Prompt | https://docs.windsurf.com/windsurf/cascade/memories | "Workspace: `.windsurf/rules/*.md` (each rule as one file). Optional YAML frontmatter key `trigger`: `always_on`, `model_decision`, `glob`, or `manual`. Each file limited to 12,000 characters." | `.windsurf/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.windsurf/rules`) |
| Skill | https://docs.windsurf.com/windsurf/cascade/skills | "Workspace: `.windsurf/skills/<skill-name>/`. Each skill requires a `SKILL.md` file with YAML frontmatter. Required keys: `name` (lowercase letters, numbers, hyphens only), `description`." | `.windsurf/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.windsurf/skills`) |
| Command | https://docs.windsurf.com/windsurf/cascade/workflows | "Workspace: `.windsurf/workflows/*.md`. Called using `/[workflow-name]` slash commands. Files limited to 12,000 characters each." | `.windsurf/workflows/<name>.md` (strategy: `copy-file`, installDir: `.windsurf/workflows`) |
| Sub-agent | ❌ | ❌ | Windsurf does not have a sub-agent file format. |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.windsurf.com/windsurf/cascade/mcp | "File location: `~/.codeium/windsurf/mcp_config.json` (single global file, no project-level equivalent)." | macOS/Linux: `~/.codeium/windsurf/mcp_config.json` → key `mcpServers`; Windows: `%APPDATA%\Codeium\windsurf\mcp_config.json` → key `mcpServers` |
| Prompt | ❌ | ❌ | Windsurf does not support global prompt installation via directory. Note: a single global rules file exists at `~/.codeium/windsurf/memories/global_rules.md` but is a single file, not a directory-based install. |
| Skill | ❌ | ❌ | Windsurf does not support global skill installation. |
| Command | ❌ | ❌ | Windsurf does not support global command installation. |
| Sub-agent | ❌ | ❌ | Windsurf does not have a sub-agent file format. |

### Roo Code

Homepage: https://docs.roocode.com/

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.roocode.com/features/mcp/using-mcp-in-roo | "Project-level config: `.roo/mcp.json`. Key: `mcpServers`. Format: `{ \"mcpServers\": { \"server-name\": { \"command\": \"...\", \"args\": [...] } } }`." | `.roo/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.roocode.com/features/custom-instructions | "Workspace rules: `.roo/rules/` and `.roo/rules-{modeSlug}/`. Files recursively read in alphabetical order. Supports `.md` and `.txt` extensions." | `.roo/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.roo/rules`) |
| Skill | https://docs.roocode.com/features/skills | "Project-level: `<project-root>/.roo/skills/{skill-name}/SKILL.md`. Required frontmatter: `name` (must match directory name, 1–64 lowercase alphanumeric + hyphens), `description` (1–1024 chars)." | `.roo/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.roo/skills`) |
| Command | https://docs.roocode.com/features/slash-commands | "Project-specific: `.roo/commands/`. Markdown with optional frontmatter: `description`, `argument-hint`, `mode`. Filename auto-converts to command name (e.g. `review.md` → `/review`)." | `.roo/commands/<name>.md` (strategy: `copy-file`, installDir: `.roo/commands`) |
| Sub-agent | ❌ | ❌ | Roo Code does not support sub-agent configuration files. |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | ❌ | ❌ | Roo Code does not support global MCP installation via file. |
| Prompt | https://docs.roocode.com/features/custom-instructions | "Global rules: Linux/macOS: `~/.roo/rules/` and `~/.roo/rules-{modeSlug}/`; Windows: `%USERPROFILE%\.roo\rules\`." | `~/.roo/rules/<name>.md` (strategy: `create-file-in-dir`) — docs support confirmed; adapter not yet implemented |
| Skill | https://docs.roocode.com/features/skills | "Global (Roo-specific): Linux/macOS: `~/.roo/skills/{skill-name}/SKILL.md`; Windows: `%USERPROFILE%\.roo\skills\{skill-name}\SKILL.md`." | `~/.roo/skills/<name>/SKILL.md` (strategy: `copy-file`) — docs support confirmed; adapter not yet implemented |
| Command | https://docs.roocode.com/features/slash-commands | "Global: `~/.roo/commands/`." | `~/.roo/commands/<name>.md` (strategy: `copy-file`) — docs support confirmed; adapter not yet implemented |
| Sub-agent | ❌ | ❌ | Roo Code does not support sub-agent configuration files. |

### Kiro CLI

Homepage: https://kiro.dev/docs/

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://kiro.dev/docs/mcp/configuration/ | "Workspace level: `.kiro/settings/mcp.json` (project-specific). User level: `~/.kiro/settings/mcp.json` (global across workspaces). When both exist, configurations are merged with workspace settings taking precedence." | `.kiro/settings/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://kiro.dev/docs/steering/ | "Workspace-level: Files are stored in `.kiro/steering/` within your project root. Format: YAML frontmatter (`inclusion` key) + Markdown body." | `.kiro/steering/<name>.md` (strategy: `create-file-in-dir`, installDir: `.kiro/steering`) |
| Skill | https://kiro.dev/docs/skills/ | "Workspace Skills: Stored in `.kiro/skills/` within your project directory. Required frontmatter: `name` (must match folder name, max 64 chars), `description` (max 1024 chars)." | `.kiro/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.kiro/skills`) |
| Command | ❌ | ❌ | Kiro does not support custom slash commands via files. |
| Sub-agent | https://kiro.dev/docs/chat/subagents/ | "Workspace scope: `<workspace>/.kiro/agents`. Markdown + YAML frontmatter. Required: `name`. Optional: `description`, `tools`, `model`, `includeMcpJson`." | `.kiro/agents/<name>.md` (strategy: `copy-file`, installDir: `.kiro/agents`) |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://kiro.dev/docs/mcp/configuration/ | "User level: `~/.kiro/settings/mcp.json` (global across workspaces)." | `~/.kiro/settings/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://kiro.dev/docs/steering/ | "Global-level: Files reside in `~/.kiro/steering/` in your home directory, extending to all workspaces across your machine." | `~/.kiro/steering/<name>.md` (strategy: `create-file-in-dir`) — docs support confirmed; adapter not yet implemented |
| Skill | https://kiro.dev/docs/skills/ | "Global Skills: Located in `~/.kiro/skills/` in your home directory." | `~/.kiro/skills/<name>/SKILL.md` (strategy: `copy-file`) — docs support confirmed; adapter not yet implemented |
| Command | ❌ | ❌ | Kiro does not support custom slash commands via files. |
| Sub-agent | https://kiro.dev/docs/chat/subagents/ | "Global scope: `~/.kiro/agents`." | `~/.kiro/agents/<name>.md` (strategy: `copy-file`) |

### Codex CLI

Homepage: https://github.com/openai/codex

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://developers.openai.com/codex/mcp | "Config file: `~/.codex/config.toml` (global) or `.codex/config.toml` (project). TOML table format: `[mcp_servers.<server-name>]`. Example: `[mcp_servers.playwright]\ncommand = \"npx\"\nargs = [\"@modelcontextprotocol/server-playwright\"]`." | macOS/Linux: `~/.codex/config.toml` (TOML table format: `[mcp_servers.<name>]`); Windows: `%USERPROFILE%\.codex\config.toml` |
| Prompt | https://developers.openai.com/codex/guides/agents-md | "Discovery order: `~/.codex/AGENTS.override.md` → `~/.codex/AGENTS.md` → `.codex/AGENTS.md` → `AGENTS.md` (project root) → parent directory AGENTS.md (cascade up). File size limit: 32 KiB." | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | (unknown) | (unknown) — No dedicated official doc page found for Codex CLI skills | `.codex/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.codex/skills`) |
| Command | ❌ | ❌ | Codex CLI does not support custom slash commands via files. |
| Sub-agent | https://developers.openai.com/codex/subagents | "Project-level: `.codex/agents/<name>.toml`. Personal-level: `~/.codex/agents/<name>.toml`. Required TOML fields: `name`, `description`, `developer_instructions`." | `.codex/agents/<name>.toml` (strategy: `copy-file`, installDir: `.codex/agents`) |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://developers.openai.com/codex/mcp | "Global config: `~/.codex/config.toml`. TOML table format: `[mcp_servers.<server-name>]`." | macOS/Linux: `~/.codex/config.toml` (TOML table format: `[mcp_servers.<name>]`); Windows: `%USERPROFILE%\.codex\config.toml` |
| Prompt | https://developers.openai.com/codex/guides/agents-md | "Global: `~/.codex/AGENTS.md` and `~/.codex/AGENTS.override.md`." | `~/.codex/AGENTS.md` (strategy: `append-with-marker`) |
| Skill | (unknown) | (unknown) — No dedicated official doc page found for Codex CLI skills | `~/.codex/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | ❌ | ❌ | Codex CLI does not support custom slash commands via files. |
| Sub-agent | https://developers.openai.com/codex/subagents | "Personal-level: `~/.codex/agents/<name>.toml`. TOML format." | `~/.codex/agents/<name>.toml` (strategy: `copy-file`) |

### Tabnine CLI

Homepage: https://docs.tabnine.com/

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.tabnine.com/main/getting-started/tabnine-agent/mcp-intro-and-setup | "MCP servers are configured via a JSON file placed in: `/.tabnine/mcp_servers.json` (project root) or `~/.tabnine/mcp_servers.json` (home directory). Top-level container key: `mcpServers`." | `.tabnine/mcp_servers.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.tabnine.com/main/getting-started/tabnine-agent/guidelines | "Guidelines are stored as Markdown files in `/.tabnine/guidelines/` directories. Project-level: `$PROJECT_FOLDER/.tabnine/guidelines/appguidelines.md`." | `.tabnine/guidelines/<name>.md` (strategy: `create-file-in-dir`, installDir: `.tabnine/guidelines`) |
| Skill | ❌ | ❌ | Tabnine CLI does not support project-level skill directories. |
| Command | https://docs.tabnine.com/main/getting-started/tabnine-cli/features/cli-commands | "Local scope: `<project-root>/.tabnine/agent/commands/` (project-specific). Global scope: `~/.tabnine/agent/commands/` (all projects)." | `.tabnine/agent/commands/<name>.md` (strategy: `copy-file`, installDir: `.tabnine/agent/commands`) |
| Sub-agent | ❌ | ❌ | Tabnine CLI does not support sub-agent configuration files. |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.tabnine.com/main/getting-started/tabnine-agent/mcp-intro-and-setup | "Home directory: `~/.tabnine/mcp_servers.json`. Key: `mcpServers`." | `~/.tabnine/mcp_servers.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.tabnine.com/main/getting-started/tabnine-agent/guidelines | "Home directory: `~/.tabnine/guidelines/`. Markdown files." | `~/.tabnine/guidelines/<name>.md` (strategy: `create-file-in-dir`) |
| Skill | ❌ | ❌ | Tabnine CLI does not support skill directories. |
| Command | https://docs.tabnine.com/main/getting-started/tabnine-cli/features/cli-commands | "Global: `~/.tabnine/agent/commands/` (all projects)." | `~/.tabnine/agent/commands/<name>.md` (strategy: `copy-file`) |
| Sub-agent | ❌ | ❌ | Tabnine CLI does not support sub-agent configuration files. |

### Kimi Code

Homepage: https://moonshotai.github.io/kimi-cli/

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://moonshotai.github.io/kimi-cli/en/customization/mcp.html | "MCP server configuration is stored at `~/.kimi/mcp.json`. The configuration uses JSON with a structure compatible with other MCP clients: `{ \"mcpServers\": { \"server-name\": { ... } } }`." | macOS/Linux: `~/.kimi/mcp.json` → key `mcpServers`; Windows: `%USERPROFILE%\.kimi\mcp.json` → key `mcpServers` |
| Prompt | (未知) | (未知) — `agents.html` 页面仅描述 YAML 格式的自定义 agent 配置，未提及 AGENTS.md 支持 | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://moonshotai.github.io/kimi-cli/en/customization/skills.html | "Project-Level Paths (brand group): `.kimi/skills/`. Also compatible with `.claude/skills/`, `.codex/skills/`, `.agents/skills/`. Each skill requires a `SKILL.md` file with YAML frontmatter." | `.kimi/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.kimi/skills`) |
| Command | ❌ | ❌ | Kimi Code does not support custom slash commands via files. |
| Sub-agent | ❌ | ❌ | Kimi Code does not support sub-agent configuration files. |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://moonshotai.github.io/kimi-cli/en/customization/mcp.html | "MCP server configuration is stored at `~/.kimi/mcp.json` (single global file)." | macOS/Linux: `~/.kimi/mcp.json` → key `mcpServers`; Windows: `%USERPROFILE%\.kimi\mcp.json` → key `mcpServers` |
| Prompt | ❌ | ❌ | Kimi Code does not support global prompt installation. |
| Skill | https://moonshotai.github.io/kimi-cli/en/customization/skills.html | "User-Level Paths (brand group): `~/.kimi/skills/`. Also compatible with `~/.claude/skills/`, `~/.agents/skills/`." | `~/.kimi/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | ❌ | ❌ | Kimi Code does not support custom slash commands via files. |
| Sub-agent | ❌ | ❌ | Kimi Code does not support sub-agent configuration files. |

### Trae

Homepage: https://docs.trae.ai/

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.trae.ai/ide/model-context-protocol | (未知) — 官方文档仅概述协议概念（"MCP servers support three transport types: stdio, SSE, and Streamable HTTP."），未提供配置文件路径 | `.trae/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.trae.ai/ide/rules | "Project rules are stored in the `.trae/rules` directory within your project root. Rules use Markdown syntax with a YAML-style header. Key properties: `alwaysApply`, `description`, `globs`, `scene`." | `.trae/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.trae/rules`) |
| Skill | https://docs.trae.ai/ide/skills | "Project Skills: Located in the `.trae/skills/` directory under the project path. Each skill requires a `SKILL.md` file with frontmatter: `name`, `description`." | `.trae/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.trae/skills`) |
| Command | ❌ | ❌ | Trae does not support custom slash commands via files. |
| Sub-agent | ❌ | ❌ | Trae does not support sub-agent configuration files. |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | ❌ | ❌ | Trae does not support global MCP installation. |
| Prompt | ❌ | ❌ | Trae does not support global prompt installation. |
| Skill | https://docs.trae.ai/ide/skills | "Global Skills: macOS/Linux: `~/.trae/skills`. Windows: `%userprofile%/.trae/skills`." | `~/.trae/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | ❌ | ❌ | Trae does not support custom slash commands via files. |
| Sub-agent | ❌ | ❌ | Trae does not support sub-agent configuration files. |

### OpenClaw

Homepage: https://openclawlab.com/en/docs/

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | ❌ | ❌ — GitHub issue #4834 已关闭，状态 "not planned" | Native MCP support was marked NOT_PLANNED by maintainers (GitHub issue #4834). |
| Prompt | https://openclawlab.com/en/docs/ | "AGENTS.md contains operating instructions for the agent and how it should use memory, is loaded at the start of every session, and is a good place for rules, priorities, and 'how to behave' details." (Workspace file at `~/.openclaw/workspace/AGENTS.md`) | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://openclawlab.com/en/docs/tools/skills-config/ | "The skills configuration is located at `~/.openclaw/openclaw.json` under the `skills` key. `load.extraDirs` — additional skill directories to scan." | `.openclaw/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.openclaw/skills`) |
| Command | ❌ | ❌ | OpenClaw does not support custom slash commands via files. |
| Sub-agent | ❌ | ❌ | OpenClaw does not support sub-agent configuration files. |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | ❌ | ❌ | Native MCP support was marked NOT_PLANNED by maintainers (GitHub issue #4834). |
| Prompt | ❌ | ❌ | OpenClaw does not support global prompt installation. |
| Skill | https://openclawlab.com/en/docs/tools/skills-config/ | "The default workspace path is `~/.openclaw/workspace`. Skills can be loaded from additional directories via `skills.load.extraDirs` in `~/.openclaw/openclaw.json`." | `~/.openclaw/workspace/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | ❌ | ❌ | OpenClaw does not support custom slash commands via files. |
| Sub-agent | ❌ | ❌ | OpenClaw does not support sub-agent configuration files. |

### Mistral Vibe

Homepage: https://docs.mistral.ai/mistral-vibe/

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.mistral.ai/mistral-vibe/introduction/configuration | "Vibe searches for config in order: `./.vibe/config.toml` (current dir), then `~/.vibe/config.toml` (home). MCP servers defined under `[[mcp_servers]]` array. File format: TOML." | `.vibe/config.toml` (TOML array format: `[[mcp_servers]]`) |
| Prompt | https://docs.mistral.ai/mistral-vibe/agents-skills | (未知) — agents-skills 页面仅描述自定义 agent TOML 配置和 SKILL.md，未提及 AGENTS.md 支持 | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://docs.mistral.ai/mistral-vibe/agents-skills | "Skills use `SKILL.md` files with YAML frontmatter in directories like `~/.vibe/skills/code-review/`. Frontmatter fields: `name`, `description`, `license`, `compatibility`, `user-invocable`, `allowed-tools`." | `.vibe/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.vibe/skills`) |
| Command | ❌ | ❌ | Mistral Vibe does not support custom slash commands via files. |
| Sub-agent | ❌ | ❌ | Mistral Vibe does not support sub-agent configuration files. |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://docs.mistral.ai/mistral-vibe/introduction/configuration | "Global: `~/.vibe/config.toml`. MCP servers defined under `[[mcp_servers]]` array." | `~/.vibe/config.toml` (TOML array format: `[[mcp_servers]]`) |
| Prompt | ❌ | ❌ | Mistral Vibe does not support global prompt installation. |
| Skill | https://docs.mistral.ai/mistral-vibe/agents-skills | "Skills stored in `~/.vibe/skills/` (global). Config in `config.toml`: `skill_paths = [\"/path/to/custom/skills\"]`." | `~/.vibe/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | ❌ | ❌ | Mistral Vibe does not support custom slash commands via files. |
| Sub-agent | ❌ | ❌ | Mistral Vibe does not support sub-agent configuration files. |

### Claude Desktop

Homepage: https://claude.ai/

#### Project Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://modelcontextprotocol.io/quickstart/user | "The file is located at: macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`. Windows: `%APPDATA%\Claude\claude_desktop_config.json`. (Linux not mentioned in official docs.)" | macOS: `~/Library/Application Support/Claude/claude_desktop_config.json` → key `mcpServers`; Windows: `%APPDATA%\Claude\claude_desktop_config.json` → key `mcpServers`; Linux: `~/.config/Claude/claude_desktop_config.json` → key `mcpServers` (path unverified, not in official docs) |
| Prompt | ❌ | ❌ | UI-based chat application, no project-level rules files |
| Skill | ❌ | ❌ | UI-based chat application, no skill directory |
| Command | ❌ | ❌ | UI-based chat application, no custom slash commands |
| Sub-agent | ❌ | ❌ | UI-based chat application, no sub-agent config files |

#### Global Level

| Asset Type | Doc URL | Doc Excerpt | Key Info |
|------------|---------|-------------|----------|
| MCP | https://modelcontextprotocol.io/quickstart/user | "macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`. Windows: `%APPDATA%\Claude\claude_desktop_config.json`. Global-only config (no project-level equivalent)." | macOS: `~/Library/Application Support/Claude/claude_desktop_config.json` → key `mcpServers`; Windows: `%APPDATA%\Claude\claude_desktop_config.json` → key `mcpServers`; Linux: `~/.config/Claude/claude_desktop_config.json` → key `mcpServers` (path unverified, not in official docs) |
| Prompt | ❌ | ❌ | UI-based chat application, no rules files |
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
