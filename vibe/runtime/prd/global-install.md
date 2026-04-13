# PRD: 全局安装 `-g`

**状态**: Draft
**日期**: 2026-04-09

---

## 背景

当前 agent-add 仅支持项目级安装，资产写入 CWD 下的宿主目录（如 `.cursor/skills/`、`.claude/agents/`）。用户需要将常用资产（如通用 Prompt、个人 Skill、常用 MCP 配置）安装到用户级目录，使其在所有项目中生效。

### 竞品分析：npx skills `-g`

Vercel 的 `npx skills` CLI 支持 `-g` 全局安装：

- **存储位置**：全局 Skill 存储在 `~/.<host>/skills/` 等用户级目录
- **Symlink 模式（默认）**：从各宿主目录链接到 `~/.agents/skills/` 中心目录，单一副本、更新即时生效
- **Copy 模式（`--copy`）**：各宿主独立副本，适用于不支持 symlink 的环境
- **已知问题**：
  - Windows 需 Developer Mode 或管理员权限才能创建 symlink（Issue #304）
  - 部分宿主不识别 symlink 目录（Antigravity IDE Issue #633）
  - 多宿主 symlink 管理复杂，remove 操作可能破坏其他宿主的链接（Issue #287）
  - `npx skills update` 在 symlink 模式下频繁失败（Issue #371、#423）
  - Cursor 官方仅支持 `~/.cursor/skills/`，不识别 `~/.agents/skills/` 的 symlink（Issue #421）

---

## 需求

### CLI 变更

- 新增 `-g` / `--global` 标志
- `-g` 为全局模式标志，**每条命令至多出现一次**；整条命令要么全局安装（`-g`），要么项目安装，两者不能混用（与 `--host` 同级别的互斥语义）
- 可与所有资产类型标志组合使用：`--mcp -g`、`--skill -g`、`--prompt -g` 等
- 与 `--pack -g` 组合时，Pack 内所有资产均安装到全局路径

### HostAdapter 接口变更

各宿主 Adapter 需为支持的资产类型提供全局安装路径。当前 `src/hosts/README.md` 中已记录了大量宿主的用户级路径：

| 宿主 | 资产类型 | 全局路径 |
|------|---------|---------|
| Cursor | MCP | `~/.cursor/mcp.json` |
| Cursor | Skill | `~/.cursor/skills/` |
| Cursor | Sub-agent | `~/.cursor/agents/` |
| Claude Code | MCP | `~/.claude.json` |
| Claude Code | Skill | `~/.claude/skills/` |
| Claude Code | Prompt | `~/.claude/CLAUDE.md` |
| Claude Code | Sub-agent | `~/.claude/agents/` |
| Gemini CLI | MCP | `~/.gemini/settings.json` |
| Gemini CLI | Skill | `~/.gemini/skills/` |
| Gemini CLI | Sub-agent | `~/.gemini/agents/` |
| Codex CLI | MCP | `~/.codex/config.toml` |
| Codex CLI | Prompt | `~/.codex/AGENTS.md` |
| Codex CLI | Sub-agent | `~/.codex/agents/` |
| Kiro CLI | MCP | `~/.kiro/settings/mcp.json` |
| Kiro CLI | Sub-agent | `~/.kiro/agents/` |
| opencode | Skill | `~/.config/opencode/skills/` |
| opencode | Prompt | `~/.config/opencode/AGENTS.md` |
| opencode | Command | `~/.config/opencode/commands/` |
| opencode | Sub-agent | `~/.config/opencode/agents/` |
| Augment | MCP | `~/.augment/settings.json` |
| Augment | Prompt | `~/.augment/rules/` |
| Augment | Command | `~/.augment/commands/` |
| Augment | Sub-agent | `~/.augment/agents/` |
| Windsurf | MCP | `~/.codeium/windsurf/mcp_config.json` |
| Tabnine | MCP | `~/.tabnine/mcp_servers.json` |
| Tabnine | Prompt | `~/.tabnine/guidelines/` |
| Tabnine | Command | `~/.tabnine/agent/commands/` |
| Kimi Code | MCP | `~/.kimi/mcp.json` |
| Claude Desktop | MCP | macOS `~/Library/Application Support/Claude/claude_desktop_config.json`; Windows `%APPDATA%\Claude\claude_desktop_config.json` |

### 安装逻辑

1. `installer.ts` 检测 `-g` 标志
2. 构建 InstallJob 时，使用 `globalInstallDir` / `globalConfigFile` 替代项目级路径
3. 若宿主某资产类型不提供全局路径，跳过并在 Summary 中说明
4. 路径中的 `~` 需展开为 `os.homedir()`，Windows `%APPDATA%` 需用 `process.env.APPDATA`

### 设计决策

- **不做 symlink**：直接 copy 到用户级目录。规避 npx skills 踩过的 Windows 兼容性坑（需管理员权限、部分宿主不识别 symlink）
- **不引入中心目录**：不使用 `~/.agents/` 等跨宿主中心目录，各宿主独立管理自己的全局路径，简单可靠
- **AGENT_ADD_HOME 复用**：测试中 `AGENT_ADD_HOME` 环境变量可同时覆盖全局安装路径，确保测试隔离

---

## 非目标

- 不实现 symlink 安装模式
- 不实现全局资产的 list / remove / update 管理
- 不引入跨宿主中心目录（如 `~/.agents/`）
