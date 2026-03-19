# 宿主能力矩阵研究文档

**Feature**: `002-more-hosts`
**研究时间**: 2026-03-17
**参考基准**: [spec-kit 支持的宿主列表](https://github.com/github/spec-kit)

---

## 研究目标

整理与 spec-kit 宿主列表对齐所需的所有宿主配置信息，为 `hosts.json` 扩展和新 Host Adapter 实现提供基础。

---

## 当前已实现宿主

| 宿主 | 标识 | MCP | Prompt | Command | Skill | Sub-agent |
|------|------|-----|--------|---------|-------|-----------|
| Cursor | `cursor` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Claude Code | `claude-code` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Claude Desktop | `claude-desktop` | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 待新增宿主详细调研

### 1. Windsurf

**标识**: `windsurf`
**官网**: https://windsurf.com/
**文档**: https://docs.windsurf.com/windsurf/mcp, https://docs.windsurf.com/windsurf/cascade/skills

**检测路径**:
- `~/.codeium/windsurf/` (全局安装目录)
- `.windsurf/` (项目级配置目录，存在即表明项目启用了 Windsurf)

**MCP**:
- 配置文件: `~/.codeium/windsurf/mcp_config.json`（**仅全局，无项目级 MCP 配置**）
- 配置键: `mcpServers`
- 格式: 标准 JSON `mcpServers` 格式（与 Cursor/Claude Code 相同）
- 说明: Windsurf MCP 仅支持全局配置，变更需重启 Windsurf

**Prompt/Rules**:
- 项目级: `.windsurf/rules/` 目录下的 `.md` 文件（新格式）
- 遗留格式: `.windsurfrules`（项目根目录单文件）
- 全局: `~/.codeium/windsurf/global_rules.md`
- 写入策略: 在 `.windsurf/rules/` 目录下创建新 `.md` 文件

**Skill**:
- 项目级: `.windsurf/skills/<name>/SKILL.md`
- 全局: `~/.codeium/windsurf/skills/<name>/SKILL.md`
- 格式: 与 Cursor/Claude Code 相同（YAML frontmatter + 内容）

**Command**:
- ❌ 不支持自定义 slash commands
- Windsurf 有 Workflows 功能（`.windsurf/workflows/`），但与 Command 语义不同，不纳入本次支持范围

**Sub-agent**:
- ❌ 无明确的 sub-agent 文件格式支持

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `~/.codeium/windsurf/mcp_config.json` → `mcpServers.<name>` |
| Skill | ✅ | `.windsurf/skills/<name>/SKILL.md` |
| Prompt | ✅ | `.windsurf/rules/<name>.md`（新建文件） |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 2. GitHub Copilot (VS Code)

**标识**: `github-copilot`
**文档**: https://code.visualstudio.com/docs/copilot/customization/custom-instructions, https://docs.github.com/en/copilot/tutorials/enhance-agent-mode-with-mcp

**检测路径**:
- `.github/copilot-instructions.md`
- `.vscode/`

**MCP**:
- 配置文件: `.vscode/mcp.json`（项目级）
- 配置键: `mcpServers`
- 格式: 标准 JSON `mcpServers` 格式
- 说明: VS Code Agent Mode 功能，需要 VS Code 1.99+

**Prompt/Rules**:
- 项目级: `.github/copilot-instructions.md`（自动应用到所有 chat 请求）
- 文件级: `.instructions.md`（条件应用，基于 glob 匹配）
- 也兼容: `AGENTS.md`（多 AI agent 场景）
- 写入策略: 追加到 `.github/copilot-instructions.md`（标记块包裹）

**Skill**:
- ❌ 无 Skill 概念

**Command**:
- ❌ 无自定义 slash commands

**Sub-agent**:
- `.github/agents/<name>.agent.md`（VS Code 2026 新功能）
- 说明: 需要 VS Code 较新版本，尚处于功能发布初期

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `.vscode/mcp.json` → `mcpServers.<name>` |
| Prompt | ✅ | `.github/copilot-instructions.md`（marker 块） |
| Skill | ❌ | — |
| Command | ❌ | — |
| Sub-agent | ⚠️ 部分 | `.github/agents/<name>.agent.md`（需新版 VS Code） |

---

### 3. Gemini CLI

**标识**: `gemini`
**文档**: https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html, https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html

**检测路径**:
- `.gemini/`
- `GEMINI.md`（项目根目录）

**MCP**:
- 配置文件: `~/.gemini/settings.json`（全局）或 `.gemini/settings.json`（项目级）
- 配置键: `mcpServers`
- 格式: 标准 JSON `mcpServers` 格式
- CLI 命令: `gemini mcp add`

**Prompt/Rules**:
- 项目级: `GEMINI.md`（项目根目录，逐级向上扫描合并）
- 全局: `~/.gemini/GEMINI.md`
- 写入策略: 追加到项目根目录 `GEMINI.md`（标记块包裹）

**Skill**:
- ❌ 无标准 Skill 格式（Extensions 系统不等价于 Skill）

**Command**:
- ❌ 无自定义 slash commands（Extensions 可以打包 MCP，但与 Command 语义不同）

**Sub-agent**:
- ❌ 无 sub-agent 文件格式

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `.gemini/settings.json` → `mcpServers.<name>` |
| Prompt | ✅ | `GEMINI.md`（marker 块） |
| Skill | ❌ | — |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 4. Codex CLI (OpenAI)

**标识**: `codex`
**文档**: https://developers.openai.com/codex/mcp, https://developers.openai.com/codex/guides/agents-md

**检测路径**:
- `~/.codex/`
- `.codex/`（项目级）

**MCP**:
- 配置文件: `~/.codex/config.toml`（全局）或 `.codex/config.toml`（项目级，需信任）
- 格式: **TOML 格式**（与其他宿主不同！使用 `[mcp_servers.<name>]` TOML table）
- 示例:
  ```toml
  [mcp_servers.context7]
  command = "npx"
  args = ["-y", "@upstash/context7-mcp"]
  ```
- CLI 命令: `codex mcp add <name> -- <command>`
- ⚠️ **重要**: 格式与标准 JSON `mcpServers` 不同，需特殊适配器

**Prompt/Rules**:
- 项目级: `AGENTS.md`（逐级目录扫描，支持 `AGENTS.override.md`）
- 全局: `~/.codex/AGENTS.md`
- 写入策略: 追加到项目根目录 `AGENTS.md`（标记块包裹）

**Skill**:
- ❌ 无 Skill 概念

**Command**:
- ❌ 无自定义 slash commands

**Sub-agent**:
- ❌（有 Subagent 概念，但指云端并行任务，非本地文件配置）

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `.codex/config.toml` → `[mcp_servers.<name>]` TOML table |
| Prompt | ✅ | `AGENTS.md`（marker 块） |
| Skill | ❌ | — |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 5. Roo Code

**标识**: `roo-code`
**文档**: https://docs.roocode.com/features/mcp/using-mcp-in-roo, https://docs.roocode.com/features/skills

**检测路径**:
- `.roo/`

**MCP**:
- 配置文件: `.roo/mcp.json`（项目级）
- 全局: `~/.roo/mcp_settings.json`（macOS/Linux）或 `%USERPROFILE%\.roo\mcp_settings.json`（Windows）
- 配置键: `mcpServers`
- 格式: 标准 JSON `mcpServers` 格式

**Prompt/Rules**:
- 项目级: `.roo/rules/` 目录下的 `.md` 文件
- 遗留格式: `.roorules`（项目根目录单文件）
- 写入策略: 在 `.roo/rules/` 目录下创建新 `.md` 文件

**Skill**:
- 项目级: `.roo/skills/<name>/SKILL.md`
- 全局: `~/.roo/skills/<name>/SKILL.md`
- 格式: 与 Cursor/Claude Code 相同（YAML frontmatter + 内容，含 `name` 和 `description`）

**Command**:
- ❌ 无自定义 slash commands

**Sub-agent**:
- ❌ 无 sub-agent 文件格式

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `.roo/mcp.json` → `mcpServers.<name>` |
| Skill | ✅ | `.roo/skills/<name>/SKILL.md` |
| Prompt | ✅ | `.roo/rules/<name>.md`（新建文件） |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 6. Kilo Code

**标识**: `kilo-code`
**文档**: https://kilo.ai/docs/automate/mcp/using-in-kilo-code, https://kilo.ai/docs/customize/custom-rules

**检测路径**:
- `.kilocode/`

**MCP**:
- 配置文件: `.kilocode/mcp.json`（项目级）
- 全局: VS Code 用户设置中
- 配置键: `mcpServers`
- 格式: 标准 JSON `mcpServers` 格式

**Prompt/Rules**:
- 项目级: `.kilocode/rules/` 目录下的 `.md` 文件
- 写入策略: 在 `.kilocode/rules/` 目录下创建新 `.md` 文件

**Skill**:
- ❌ 尚无明确的 Skill 系统（Cline fork，可能未实现）

**Command**:
- ❌ 无自定义 slash commands

**Sub-agent**:
- ❌ 无 sub-agent 文件格式

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `.kilocode/mcp.json` → `mcpServers.<name>` |
| Prompt | ✅ | `.kilocode/rules/<name>.md`（新建文件） |
| Skill | ❌ | — |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 7. Qwen Code

**标识**: `qwen-code`
**文档**: https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/, https://qwenlm.github.io/qwen-code-docs/en/users/configuration/settings/

**检测路径**:
- `.qwen/`

**MCP**:
- 配置文件: `.qwen/settings.json`（项目级）或 `~/.qwen/settings.json`（全局）
- 配置键: `mcpServers`
- 格式: 标准 JSON `mcpServers` 格式

**Prompt/Rules**:
- 项目级: `AGENTS.md`（项目根目录）
- 全局: `~/.qwen/AGENTS.md`
- 写入策略: 追加到项目根目录 `AGENTS.md`（marker 块包裹）
- 文档: https://github.com/QwenLM/qwen-code/issues/504

**Skill**:
- 项目级: `.qwen/skills/<name>/SKILL.md`
- 格式: 与 Cursor/Claude Code 相同

**Command**:
- ❌ 无自定义 slash commands

**Sub-agent**:
- ❌ 无 sub-agent 文件格式

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `.qwen/settings.json` → `mcpServers.<name>` |
| Prompt | ✅ | `AGENTS.md`（marker 块） |
| Skill | ✅ | `.qwen/skills/<name>/SKILL.md` |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 8. opencode

**标识**: `opencode`
**文档**: https://open-code.ai/docs/en/config, https://opencode-tutorial.com/en/docs/rules

**检测路径**:
- `opencode.json`（项目根目录）
- `~/.config/opencode/`

**MCP**:
- 配置文件: `opencode.json`（项目级）或 `~/.config/opencode/opencode.json`（全局）
- 配置键: `mcpServers`（JSON 格式，嵌套在 `opencode.json` 顶层对象中）
- 格式: 标准 JSON `mcpServers` 格式

**Prompt/Rules**:
- 项目级: `AGENTS.md`（项目根目录）
- 全局: `~/.config/opencode/AGENTS.md`
- 写入策略: 追加到项目根目录 `AGENTS.md`（标记块包裹）

**Skill**:
- ❌ 无 Skill 系统

**Command**:
- ❌ 无自定义 slash commands

**Sub-agent**:
- ❌ 无 sub-agent 文件格式

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `opencode.json` → `mcpServers.<name>` |
| Prompt | ✅ | `AGENTS.md`（marker 块） |
| Skill | ❌ | — |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 9. Amp

**标识**: `amp`
**文档**: https://ampcode.com/manual

**检测路径**:
- `.agents/` 目录（workspace skills 目录）
- `~/.config/amp/`

**MCP**:
- 全局配置: `~/.config/amp/` 下（具体文件名待确认）
- IDE 扩展配置: VS Code settings `amp.mcpServers` 键
- CLI 命令: `amp mcp add <name> -- <command>` 或 `amp mcp add <name> <url>`
- 格式: 标准 JSON `mcpServers` 格式（通过 `amp mcp add` 管理）
- ⚠️ **注意**: Amp MCP 优先通过 CLI 命令管理，文件路径不固定

**Prompt/Rules**:
- 项目级: `AGENTS.md`（项目根目录，逐级向上扫描）
- 全局: `~/.config/AGENT.md`
- 写入策略: 追加到项目根目录 `AGENTS.md`（标记块包裹）

**Skill**:
- 项目级: `.agents/skills/<name>/SKILL.md`
- 全局: `~/.config/agents/skills/<name>/SKILL.md`
- 格式: YAML frontmatter（含 `name`、`description`）+ 内容，可附带 `mcp.json` 文件

**Command**:
- ❌ 自定义命令已被 Skill 系统替代（`amp skill add`）

**Sub-agent**:
- Amp 有 subagent 概念，但指并行任务（`Use 3 subagents to...`），非文件配置，不纳入支持

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ⚠️ 复杂 | 通过 `amp mcp add` CLI 命令（无统一配置文件路径） |
| Prompt | ✅ | `AGENTS.md`（marker 块） |
| Skill | ✅ | `.agents/skills/<name>/SKILL.md` |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 10. Kiro CLI (Amazon)

**标识**: `kiro`
**文档**: https://kiro.dev/docs/cli/mcp/configuration/, https://kiro.dev/docs/cli/steering/

**检测路径**:
- `.kiro/`

**MCP**:
- 配置文件: `.kiro/settings/mcp.json`（workspace 级）
- 全局: `~/.kiro/settings/mcp.json`
- 配置键: `mcpServers`
- 格式: 标准 JSON `mcpServers` 格式

**Prompt/Rules**（称为 Steering）:
- 项目级: `.kiro/steering/*.md`（支持 YAML frontmatter 控制加载时机）
- 全局: `~/.kiro/steering/*.md`
- 默认文件: `product.md`、`tech.md`、`structure.md`
- 写入策略: 在 `.kiro/steering/` 目录下创建新 `.md` 文件

**Skill**:
- ❌ 无 Skill 系统

**Command**:
- ❌ 无自定义 slash commands

**Sub-agent / Agent**:
- `.kiro/agents/<name>/` 目录（通过 `kiro-cli agent create` 创建）
- 格式: YAML frontmatter + Markdown 内容（含 `name`、`description`、`prompt`、`tools`）
- 与我们 Sub-agent 模型最接近，**需要验证格式兼容性**

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `.kiro/settings/mcp.json` → `mcpServers.<name>` |
| Prompt | ✅ | `.kiro/steering/<name>.md`（新建文件） |
| Skill | ❌ | — |
| Command | ❌ | — |
| Sub-agent | ⚠️ 待确认 | `.kiro/agents/<name>/`（格式需验证） |

---

### 11. Auggie CLI (Augment Code)

**标识**: `augment`
**文档**: https://docs.augmentcode.com/cli/rules, https://docs.augmentcode.com/cli/integrations

**检测路径**:
- `.augment/`

**MCP**:
- 配置文件: `~/.augment/settings.json`（**仅全局**）
- 配置键: `mcpServers`
- 格式: 标准 JSON `mcpServers` 格式（含 `type` 字段: `http|sse|stdio`）

**Prompt/Rules**:
- 项目级: `.augment/rules/` 目录下的 `.md` 文件（支持 frontmatter: `type: always_apply`）
- 全局: `~/.augment/rules/`
- 也兼容读取: `AGENTS.md`、`CLAUDE.md`（但 agent-get 写入应优先用 `.augment/rules/`）
- 写入策略: 在 `.augment/rules/` 目录下创建新 `.md` 文件

**Skill**:
- ❌ 无 Skill 系统

**Command**:
- ❌ 无自定义 slash commands

**Sub-agent**:
- ❌ 无 sub-agent 文件格式

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `~/.augment/settings.json` → `mcpServers.<name>` |
| Prompt | ✅ | `.augment/rules/<name>.md`（新建文件） |
| Skill | ❌ | — |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 12. Mistral Vibe

**标识**: `vibe`
**文档**: https://docs.mistral.ai/mistral-vibe/introduction/configuration

**检测路径**:
- `.vibe/`
- `~/.vibe/`

**MCP**:
- 配置文件: `.vibe/config.toml`（项目级）或 `~/.vibe/config.toml`（全局）
- 格式: **TOML 格式**，使用 `[[mcp_servers]]` 数组（与标准 JSON 格式不同！）
  ```toml
  [[mcp_servers]]
  name = "server-name"
  transport = "stdio"
  command = "uvx"
  args = ["..."]
  ```
- ⚠️ **重要**: TOML 数组格式，需特殊适配器

**Prompt/Rules**:
- 全局自定义提示: `~/.vibe/prompts/<name>.md`（仅全局，无项目级）
- ❌ 无项目级 rules 文件概念

**Skill**:
- ❌ 无 Skill 系统

**Command**:
- ❌ 无自定义 slash commands

**Sub-agent**:
- 全局自定义 Agent: `~/.vibe/agents/<name>.toml`（TOML 格式，非 Markdown）
- ❌ 不符合我们的 Sub-agent 格式（TOML vs Markdown + YAML frontmatter）

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `.vibe/config.toml` → `[[mcp_servers]]`（TOML） |
| Prompt | ⚠️ 仅全局 | `~/.vibe/prompts/<name>.md` |
| Skill | ❌ | — |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 13. Tabnine CLI

**标识**: `tabnine`
**文档**: https://docs.tabnine.com/main/getting-started/tabnine-cli/features/commands, https://docs.tabnine.com/main/getting-started/tabnine-agent/mcp-intro-and-setup

**检测路径**:
- `.tabnine/`

**MCP**:
- 配置文件: `.tabnine/mcp_servers.json`（项目级）或 `~/.tabnine/mcp_servers.json`（全局）
- 配置键: `mcpServers`
- 格式: 标准 JSON `mcpServers` 格式

**Prompt/Rules**:
- 项目级: `.tabnine/guidelines/<name>.md`（`create-file-in-dir` 策略，每个 Prompt 资产独立一个文件）
- 全局: `~/.tabnine/agent/guidelines/<name>.md`
- 写入策略: 在 `.tabnine/guidelines/` 目录下创建新 `.md` 文件
- 文档: https://docs.tabnine.com/main/getting-started/tabnine-agent/guidelines

**Skill**:
- ❌ 无 Skill 系统

**Command**:
- 内置 slash commands（`/mcp list`、`/files` 等），不支持自定义

**Sub-agent**:
- ❌ 无 sub-agent 文件格式

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `.tabnine/mcp_servers.json` → `mcpServers.<name>` |
| Prompt | ✅ | `.tabnine/guidelines/<name>.md`（新建文件） |
| Skill | ❌ | — |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 14. SHAI (OVHcloud)

**标识**: `shai`
**文档**: https://github.com/ovh/shai

**检测路径**:
- `~/.config/shai/`

**MCP**:
- 配置路径: `~/.config/shai/agents/` 下的 agent 配置文件（非独立 MCP 配置，MCP 内嵌在 agent 中）
- ⚠️ **注意**: MCP 通过 `shai agent` 子系统配置，不是独立的 `mcpServers` JSON 文件
- **待进一步研究**

**Prompt/Rules**:
- 兼容读取: `AGENTS.md`（项目级）
- 写入策略: 追加到项目根目录 `AGENTS.md`（标记块包裹）

**Skill**:
- ❌ 无 Skill 系统

**Command**:
- ❌ 无自定义 slash commands

**Sub-agent**:
- `~/.config/shai/agents/` 下的自定义 agent 配置（格式待确认）

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ⚠️ 待确认 | 通过 agent 系统配置，路径不标准 |
| Prompt | ✅ | `AGENTS.md`（marker 块） |
| Skill | ❌ | — |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 15. Kimi Code (Moonshot AI)

**标识**: `kimi`
**文档**: https://moonshotai.github.io/kimi-cli/en/customization/mcp.html, https://moonshotai.github.io/kimi-cli/en/configuration/config-files.html

**检测路径**:
- `~/.kimi/`

**MCP**:
- 配置文件: `~/.kimi/mcp.json`（**仅全局**）
- 配置键: `mcpServers`
- 格式: 标准 JSON `mcpServers` 格式
- CLI 命令: `kimi mcp add`

**Prompt/Rules**:
- 项目级: `AGENTS.md`（通过 `/init` 命令生成，`${KIMI_AGENTS_MD}` 变量注入系统提示）
- 写入策略: 追加到项目根目录 `AGENTS.md`（marker 块包裹）
- 文档: https://moonshotai.github.io/kimi-cli/en/customization/agents.html

**Skill**:
- ❌ 无 Skill 系统

**Command**:
- ❌ 无自定义 slash commands

**Sub-agent**:
- ❌ 无 sub-agent 文件格式

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `~/.kimi/mcp.json` → `mcpServers.<name>` |
| Prompt | ✅ | `AGENTS.md`（marker 块） |
| Skill | ❌ | — |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 16. OpenClaw

**标识**: `openclaw`
**文档**: https://openclawlab.com/en/docs/tools/skills-config/, https://openclawlab.com/en/docs/tools/creating-skills/

**检测路径**:
- `.openclaw/`
- `~/.openclaw/`

**MCP**:
- 配置文件: `~/.openclaw/openclaw.json`（全局，`mcp` 配置块）
- 格式: 标准 JSON `mcpServers` 格式

**Prompt/Rules**:
- 项目级: `AGENTS.md`（兼容多 Agent 标准，也支持 SOUL.md 等扩展格式）
- 写入策略: 追加到项目根目录 `AGENTS.md`（marker 块包裹）

**Skill**:
- 项目级: `.openclaw/skills/<name>/SKILL.md`
- 全局: `~/.openclaw/skills/<name>/SKILL.md`
- 格式: 与 Cursor/Claude Code 相同（YAML frontmatter + 内容）

**Command**:
- ❌ 无自定义 slash commands

**Sub-agent**:
- ❌ 无 sub-agent 文件格式

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `~/.openclaw/openclaw.json` → `mcpServers.<name>` |
| Prompt | ✅ | `AGENTS.md`（marker 块） |
| Skill | ✅ | `.openclaw/skills/<name>/SKILL.md` |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 17. Trae (字节跳动)

**标识**: `trae`
**文档**: https://traeide.com/docs, https://traeide.com/news/6

**检测路径**:
- `.trae/`

**MCP**:
- 配置文件: `.trae/mcp.json`（项目级）
- 全局: `~/.trae/mcp.json`
- 配置键: `mcpServers`
- 格式: 标准 JSON `mcpServers` 格式（v1.3.0 起支持）

**Prompt/Rules**:
- 项目级: `.trae/project_rules.md`
- 用户级: `.trae/user_rules.md`（全局）
- 写入策略: 追加到 `.trae/project_rules.md`（marker 块包裹）

**Skill**:
- ❓ 社区有 SOP 形式的 Skills，但无官方标准目录格式，**待确认**

**Command**:
- ❌ 无自定义 slash commands（有 `/tool` 调用 MCP 工具，但非可安装的 Command 资产）

**Sub-agent**:
- ❌ 无 sub-agent 文件格式

**能力矩阵**:
| 资产类型 | 支持 | 安装路径 |
|---------|------|---------|
| MCP | ✅ | `.trae/mcp.json` → `mcpServers.<name>` |
| Prompt | ✅ | `.trae/project_rules.md`（marker 块） |
| Skill | ❌ | — |
| Command | ❌ | — |
| Sub-agent | ❌ | — |

---

### 17. Jules (Google)

**标识**: `jules`
**文档**: https://jules.google.com/

**检测路径**: ❓ 未知（云端 agent，可能无本地文件系统配置）

**说明**: Jules 是 Google 的云端 AI coding agent，主要通过 Web UI 操作，缺少本地项目文件配置的官方文档。**本次优先级低，需等待更多文档。**

**能力矩阵**: 全部待确认

---

### 17. IBM Bob

**标识**: `ibm-bob`
**文档**: https://www.ibm.com/products/bob

**检测路径**: ❓ 未知

**说明**: IDE-based agent（spec-kit 描述为"IDE-based agent with slash command support"），缺少公开文档。**本次优先级低。**

**能力矩阵**: 全部待确认

---

### 18. CodeBuddy CLI

**标识**: `codebuddy`
**文档**: https://www.codebuddy.ai/cli

**检测路径**: ❓ 未知

**说明**: 公开文档有限。**本次优先级低。**

**能力矩阵**: 全部待确认

---

### 19. Qoder CLI

**标识**: `qoder`
**文档**: https://qoder.com/cli

**检测路径**: ❓ 未知

**说明**: 公开文档有限。**本次优先级低。**

**能力矩阵**: 全部待确认

---

### 20. Antigravity (agy) (Google)

**标识**: `antigravity`
**文档**: https://antigravity.google/

**检测路径**: ❓ 未知

**说明**: Google 的较新产品，公开文档有限。spec-kit 注明"Requires --ai-skills"。**本次优先级低。**

**能力矩阵**: 全部待确认

---

## 综合能力矩阵汇总

> ✅ = 支持 | ❌ = 不支持 | ⚠️ = 部分支持/待确认 | — = 无数据

| 宿主 | MCP | Prompt | Skill | Command | Sub-agent | 配置信心度 |
|------|-----|--------|-------|---------|-----------|---------|
| Cursor ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 高 |
| Claude Code ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 高 |
| Claude Desktop ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | 高 |
| Windsurf | ✅ | ✅ | ✅ | ❌ | ❌ | 高 |
| GitHub Copilot | ✅ | ✅ | ❌ | ❌ | ⚠️ | 高 |
| Gemini CLI | ✅ | ✅ | ❌ | ❌ | ❌ | 高 |
| Codex CLI | ✅ | ✅ | ❌ | ❌ | ❌ | 高（MCP 格式特殊） |
| Roo Code | ✅ | ✅ | ✅ | ❌ | ❌ | 高 |
| Kilo Code | ✅ | ✅ | ❌ | ❌ | ❌ | 高 |
| Qwen Code | ✅ | ✅ | ✅ | ❌ | ❌ | 高 |
| opencode | ✅ | ✅ | ❌ | ❌ | ❌ | 高 |
| Amp | ⚠️ | ✅ | ✅ | ❌ | ❌ | 中（MCP 无固定文件） |
| Kiro CLI | ✅ | ✅ | ❌ | ❌ | ⚠️ | 高 |
| Augment | ✅ | ✅ | ❌ | ❌ | ❌ | 高 |
| Mistral Vibe | ✅ | ⚠️ | ❌ | ❌ | ❌ | 高（MCP 格式特殊） |
| Tabnine CLI | ✅ | ✅ | ❌ | ❌ | ❌ | 高 |
| SHAI | ⚠️ | ✅ | ❌ | ❌ | ❌ | 低 |
| Kimi Code | ✅ | ✅ | ❌ | ❌ | ❌ | 高 |
| OpenClaw | ✅ | ✅ | ✅ | ❌ | ❌ | 高 |
| Trae | ✅ | ✅ | ❌ | ❌ | ❌ | 高 |
| Jules | — | — | — | — | — | 极低 |
| IBM Bob | — | — | — | — | — | 极低 |
| CodeBuddy CLI | — | — | — | — | — | 极低 |
| Qoder CLI | — | — | — | — | — | 极低 |
| Antigravity | — | — | — | — | — | 极低 |

---

## 架构影响分析

### 现有架构是否满足需求

当前 `hosts.json` + `HostConfig` + Host Adapter 架构基本满足，但需注意以下差异：

#### 1. MCP 配置格式分叉

大多数宿主使用标准 JSON `mcpServers` 格式，但以下两个例外：

| 宿主 | MCP 格式 | 当前适配器 |
|------|---------|-----------|
| Codex CLI | TOML: `[mcp_servers.<name>]` | 需要新适配器 |
| Mistral Vibe | TOML: `[[mcp_servers]]` 数组 | 需要新适配器 |

安装器通过读取 `configFile` 的文件扩展名自动识别配置格式（`.toml` → TOML，其他 → JSON），`AssetCapability` 结构不变，无需新增声明字段，向后完全兼容。

#### 2. Prompt 写入策略差异

| 写入策略 | 宿主 |
|---------|------|
| 追加到固定文件（marker 块） | Claude Code (CLAUDE.md)、Codex、Gemini、opencode、SHAI（均为 AGENTS.md 或各自等价文件） |
| 新建 `.md` 文件到 rules 目录 | Windsurf (`.windsurf/rules/`)、Roo Code (`.roo/rules/`)、Kilo Code (`.kilocode/rules/`)、Augment (`.augment/rules/`)、Kiro (`.kiro/steering/`) |
| 追加到固定文件（marker 块） | GitHub Copilot (`.github/copilot-instructions.md`)、Cursor (`AGENTS.md`) |

当前 `writeStrategy: 'append-with-marker'` 已涵盖第一类和第三类；第二类（新建文件到目录）是新的策略，需在 `writeStrategy` 中新增 `create-file-in-dir` 值。

#### 3. MCP 全局 vs 项目级差异

| 级别 | 宿主 |
|------|------|
| 仅全局 | Windsurf、Augment、Kimi Code |
| 仅项目级（受信任）+ 全局 | Codex CLI (`.codex/config.toml`) |
| 项目级 + 全局 | Cursor、Claude Code、Roo Code、Kilo Code、Qwen Code、Kiro、Tabnine |

agent-get 当前对 Cursor 和 Claude Code 写入项目级 MCP 配置，对于"仅全局"的宿主需要写入全局路径。`hosts.json` 的 `configFile` 字段已支持平台差异（`{ darwin: ..., win32: ... }`），可扩展此模式处理"全局 vs 项目级"。

---

## 实现优先级建议

### 第一组 — 文档完善，代码改动最小（本次全部实现）

这批宿主 MCP 使用标准 JSON 格式，Prompt 写入需新增 `create-file-in-dir` 策略，但 Skill 格式与现有相同：

1. **Windsurf** — 生态大，配置清晰
2. **Roo Code** — Skill 格式与 Cursor 相同，改动极小
3. **Kilo Code** — MCP + Rules 即可
4. **Gemini CLI** — 大生态，GEMINI.md 追加模式已有先例
5. **GitHub Copilot** — 大生态，`.vscode/mcp.json` + `.github/copilot-instructions.md`
6. **Qwen Code** — `.qwen/` 目录，Skill 格式与 Cursor 相同
7. **opencode** — 使用 AGENTS.md，零新逻辑
8. **Augment** — MCP 全局配置，rules 目录新建文件
9. **Kiro CLI** — Steering 文件模式
10. **Tabnine CLI** — MCP 格式标准，仅 MCP 支持
11. **Kimi Code** — MCP 全局配置
12. **OpenClaw** — MCP 全局配置，Skill 格式与 Cursor 相同，Prompt 使用 AGENTS.md
13. **Trae** — `.trae/mcp.json` + `.trae/project_rules.md`

### 第二组 — 需要新 TOML 适配器（本次全部实现）

13. **Codex CLI** — MCP 为 TOML 格式，需新适配器；Prompt 使用 AGENTS.md
14. **Mistral Vibe** — MCP 为 TOML 格式，需新适配器

### 暂缓（P3）— 文档不足，等待生态成熟

- **Amp** — MCP 无固定配置文件路径，需研究

### 第三批（P3）— 文档不足，需等待

15. **SHAI** — MCP 通过 agent 系统，非标准
16. **Jules** / **IBM Bob** / **CodeBuddy** / **Qoder** / **Antigravity** — 文档极少，暂缓

---

## 待解决的开放性问题

1. **Qwen Code Prompt 路径** — 是 `.qwen/rules/` 还是 `.clinerules`？需翻阅源码或测试
2. **Tabnine CLI Prompt 路径** — 是否有项目级 rules 文件？
3. **Kimi Code Prompt 路径** — 是否有项目级 context 文件（如 `KIMI.md`）？
4. **Amp MCP 配置文件路径** — 全局配置文件的确切路径（`~/.config/amp/` 下的哪个文件？）
5. **Kiro Sub-agent 格式** — `.kiro/agents/` 下文件格式是否与我们的 Sub-agent YAML frontmatter 兼容？
6. **SHAI MCP 配置** — 是否有独立的 `mcpServers` JSON 文件，还是只能通过 `shai agent` 管理？
7. **GitHub Copilot Sub-agent** — `.github/agents/*.agent.md` 格式是否稳定，对应哪个 VS Code 版本？

---

## 文档参考链接汇总

| 宿主 | MCP 文档 | Rules/Prompt 文档 | Skills 文档 |
|------|---------|------------------|-------------|
| Windsurf | https://docs.windsurf.com/windsurf/mcp | https://docs.windsurf.com/windsurf/cascade/agents-md | https://docs.windsurf.com/windsurf/cascade/skills |
| GitHub Copilot | https://docs.github.com/en/copilot/tutorials/enhance-agent-mode-with-mcp | https://code.visualstudio.com/docs/copilot/customization/custom-instructions | — |
| Gemini CLI | https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html | https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html | — |
| Codex CLI | https://developers.openai.com/codex/mcp | https://developers.openai.com/codex/guides/agents-md | — |
| Roo Code | https://docs.roocode.com/features/mcp/using-mcp-in-roo | — | https://docs.roocode.com/features/skills |
| Kilo Code | https://kilo.ai/docs/automate/mcp/using-in-kilo-code | https://kilo.ai/docs/customize/custom-rules | — |
| Qwen Code | https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/ | — | — |
| opencode | https://open-code.ai/docs/en/config | https://opencode-tutorial.com/en/docs/rules | — |
| Amp | https://ampcode.com/manual | https://ampcode.com/agent.md | https://ampcode.com/manual |
| Kiro CLI | https://kiro.dev/docs/cli/mcp/configuration/ | https://kiro.dev/docs/cli/steering/ | — |
| Augment | https://docs.augmentcode.com/cli/integrations | https://docs.augmentcode.com/cli/rules | — |
| Mistral Vibe | https://docs.mistral.ai/mistral-vibe/introduction/configuration | — | — |
| Tabnine CLI | https://docs.tabnine.com/main/getting-started/tabnine-agent/mcp-intro-and-setup | https://docs.tabnine.com/main/getting-started/tabnine-agent/guidelines | — |
| SHAI | https://github.com/ovh/shai | — | — |
| Kimi Code | https://moonshotai.github.io/kimi-cli/en/customization/mcp.html | https://moonshotai.github.io/kimi-cli/en/customization/agents.html | — |
| OpenClaw | https://openclawlab.com/en/docs/tools/skills-config/ | https://ruleofclaw.ai/docs | https://openclawlab.com/en/docs/tools/creating-skills/ |
| Trae | https://traeide.com/news/6 | https://traeide.com/docs | — |
