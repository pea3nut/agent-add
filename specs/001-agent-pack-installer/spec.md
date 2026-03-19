# Feature Specification: agent-get CLI

**Feature Branch**: `001-agent-pack-installer`
**Created**: 2026-03-17
**Status**: Draft

---

## Clarifications

### Session 2026-03-17

- Q: CLI 命令形式是否需要 `install` 子命令？ → A: 不需要，直接使用 `agent-get` 即可，无需 `install` 子命令
- Q: 非 TTY 环境（如 CI）下未指定 `--host` 时的行为？ → A: 报错退出（exit 2），提示"非交互环境中请使用 `--host` 指定目标宿主"，不自动选择
- Q: `--skill` source 目录不含 `SKILL.md` 时如何处理？ → A: 安装前校验，不含 `SKILL.md` 则报错退出（exit 2），说明期望结构与实际差异
- Q: `--prompt` 资产写入宿主规则文件（如 `CLAUDE.md`、`AGENTS.md`）时采用何种策略？ → A: 追加到文件末尾，用标记块包裹（如 `<!-- agent-get:pack-name -->...<!-- /agent-get:pack-name -->`）；标记块已存在则视为"已存在"跳过或更新，不重复写入
- Q: `--host` 未指定时如何自动探测当前环境中存在的宿主？ → A: 扫描当前工作目录及父目录，通过特征路径（如 `.cursor/`、`.claude/`、`~/Library/Application Support/Claude/`）探测已安装宿主，探测到的宿主置顶显示
- Q: Registry 包名作为来源 URI 类型的支持范围？ → A: 不支持，且后续无计划支持；来源 URI 仅支持本地路径、Git SSH、Git HTTPS 三种形式
- Q: `--mcp` 资产来源 JSON 文件的格式是什么？ → A: 描述单个 MCP server 的配置对象，格式与宿主原生 `mcpServers[name]` 的值一致（如 `{"command": "npx", "args": [...], "env": {...}}`）；安装器负责将其注入目标宿主配置文件的对应位置
- Q: 各宿主的资产安装路径如何确定？ → A: 通过查阅各宿主官方文档编译为静态配置（`src/hosts.json`）；Command → `.cursor/commands/<name>.md` / `.claude/commands/<name>.md`；Skill → `.cursor/skills/<name>/SKILL.md` / `.claude/skills/<name>/SKILL.md`；Prompt → `AGENTS.md`（Cursor）/ `CLAUDE.md`（Claude Code）；Sub-agent → `.cursor/agents/<name>.md` / `.claude/agents/<name>.md`；Claude Desktop 仅支持 MCP

---

## 背景与目标

当前 AI Agent 生态中存在分散的单类资产安装工具（如 `mcp add`），但没有一个统一工具能将"一组可协同工作的能力"一次性安装到不同 AI Agent 宿主中。真实场景下，有价值的 AI 能力通常是多种资产的组合（MCP + Skill + Prompt + Command + Sub-agent），而不是单个资产。

**本功能**定义一种通用"AI Agent 能力包"（Agent Pack）标准，并提供一个跨宿主的 CLI 安装器，让用户通过一条命令为不同 AI Agent 宿主安装完整能力集合。

**术语定义**：
- **Agent Pack**：一组可被统一安装的 AI 能力资产集合，等价于 TTADK 的 `plugin` 概念
- **宿主（Host）**：Cursor、Claude Desktop、Claude Code 等 AI Agent 运行环境
- **资产（Asset）**：MCP、Skill、Prompt、Command、Sub-agent 等能力单元

---

## 产品定义

### CLI 命令面（终态）

```text
Usage:
  agent-get (--mcp|--skill|--prompt|--command|--sub-agent|--pack) <source> [--host <host>]

Options:
  --mcp <source>        安装 MCP
  --skill <source>      安装 Skill
  --prompt <source>     安装 Prompt
  --command <source>    安装 Command
  --sub-agent <source>  安装 Sub-agent
  --host <host>         目标宿主标识（如 cursor、claude-code、claude-desktop 等）
  -h, --help            查看帮助
  --pack <manifest>     从 Manifest JSON 文件安装完整 Agent Pack（进阶用法）

规则:
  所有 flag 可任意组合，同一 flag 也可重复传入。
  未指定 --host 时弹出交互式选择界面，自动探测结果置顶供快速确认。

示例:
  # MCP 指向 JSON 配置文件
  agent-get --mcp ./mcps/playwright.json --host cursor
  agent-get --mcp git@github.com:org/mcps.git#playwright/playwright.json --host cursor

  # Skill 指向目录（目录内含 SKILL.md）
  agent-get --skill ./skills/e2e-guide --host claude-code
  agent-get --skill git@github.com:demo/skills.git#e2e-guide --host claude-code

  # Prompt 和 Command 指向 Markdown 文件
  agent-get --prompt ./prompts/dev-practices.md --host cursor
  agent-get --command git@github.com:org/cmds.git#tns/init.md --host claude-code

  # Sub-agent 指向 Markdown 文件
  agent-get --sub-agent ./agents/code-reviewer.md --host cursor
  agent-get --sub-agent git@github.com:org/agents.git#code-reviewer.md --host claude-code

  # 同一仓库装多个 Skill
  agent-get --skill git@github.com:demo/skills.git#e2e-guide --skill git@github.com:demo/skills.git#sso-auth

  # 混合多种资产类型一次安装
  agent-get --skill git@github.com:demo/skills.git#e2e-guide --mcp ./mcps/playwright.json --host cursor

  # 进阶：用 Manifest 一次安装完整 Agent Pack
  agent-get --pack ./agent-pack.json --host cursor
  agent-get --pack git@github.com:org/packs.git#frontend-e2e/agent-pack.json --host claude-code

说明:
  首版不支持 list / remove / update 命令。
```

### Manifest 格式（终态）

```json
{
  "name": "org/pack-name",
  "assets": [
    {
      "type": "mcp",
      "source": "./mcps/playwright.json"
    },
    {
      "type": "skill",
      "source": "git@github.com:demo/e2e-guide.git"
    },
    {
      "type": "prompt",
      "source": "./prompts/dev-practices.md"
    },
    {
      "type": "command",
      "source": "./commands/init.md"
    },
    {
      "type": "subAgent",
      "source": "./sub-agents/code-reviewer.md"
    }
  ]
}
```

**Manifest 规则**：
- `name`：全局唯一标识，格式 `namespace/pack-name`
- `assets[].type`：首版支持 `mcp` / `skill` / `prompt` / `command` / `subAgent`，其他类型（`references`、`knowledges`、`scripts`、`templates`、`resources`）在解析阶段直接报错
- `assets[].source`：字符串或字符串数组；多值时每项均独立安装；Git URL 支持 `#path` 语法指定仓库内子目录；资产名称由安装器从 source 路径自动推断（见下方"来源规则"）
- `assets[].name`：**不需要此字段**，资产名称从 source 自动推断
- `prompt` 与 `command` 是不同资产类型，不得混用；`prompt` 专指写入宿主基础规则文件（如 `CLAUDE.md`、`AGENTS.md`）的内容

### 来源（Source）规则

- 支持单值字符串或多值字符串数组；多值时每个元素是一个独立资产来源，均会被安装
- Git URL 支持 `#path` 语法指定仓库内子路径，例如 `git@github.com:org/repo.git#path/to/asset`
- URI 类型由安装器自动检测，不要求用户配置
- 支持的 URI 类型：本地路径、Git SSH、Git HTTPS、直接 HTTP(S) URL（不支持 Registry 包名，无后续计划）
- 直接 HTTP(S) URL 用于获取单个文件（如 MCP 配置 JSON）；与 Git HTTPS 的区分由安装器自动检测（不含 `.git` 且无 `#path` 语法的 `https://` 视为直接 URL）

**各资产类型的 source 格式**：

| 资产类型 | source 指向 | 示例 |
|---------|------------|------|
| `--pack` | Manifest JSON 文件（`.json`） | `./agent-pack.json`、`git@...#fe/agent-pack.json` |
| `--mcp` | 单个 MCP server 配置 JSON 文件，格式与宿主原生 `mcpServers[name]` 的值对象一致（含 `command`/`args`/`env` 等字段） | `./mcps/playwright.json`、`git@...#playwright/playwright.json` |
| `--skill` | Skill 目录（含 `SKILL.md`） | `./skills/e2e-guide`、`git@...#e2e-guide` |
| `--prompt` | Markdown 文件（`.md`） | `./prompts/dev-practices.md`、`git@...#dev-practices.md` |
| `--command` | Markdown 文件（`.md`） | `./commands/init.md`、`git@...#tns/init.md` |
| `--sub-agent` | Markdown 文件（`.md`） | `./agents/code-reviewer.md`、`git@...#code-reviewer.md` |

### 宿主能力矩阵

各宿主支持的资产类型及安装路径（完整静态配置见 `src/hosts.json`）：

| 资产类型 | Cursor | Claude Code | Claude Desktop |
|---------|--------|-------------|----------------|
| MCP | `.cursor/mcp.json` → `mcpServers.<name>` | `.mcp.json` → `mcpServers.<name>` | `~/Library/Application Support/Claude/claude_desktop_config.json` → `mcpServers.<name>` |
| Skill | `.cursor/skills/<name>/SKILL.md` | `.claude/skills/<name>/SKILL.md` | ❌ 不支持 |
| Prompt | 追加写入 `AGENTS.md`（marker 块） | 追加写入 `CLAUDE.md`（marker 块） | ❌ 不支持 |
| Command | `.cursor/commands/<name>.md` | `.claude/commands/<name>.md` | ❌ 不支持 |
| Sub-agent | `.cursor/agents/<name>.md` | `.claude/agents/<name>.md` | ❌ 不支持 |

**文档参考**：
- Cursor MCP: https://cursor.com/help/customization/mcp
- Cursor Commands/Skills: https://docs.cursor.com/context/commands
- Claude Code MCP: https://docs.anthropic.com/en/docs/claude-code/mcp
- Claude Code Skills: https://docs.claude.com/en/docs/claude-code/skills
- Claude Code Commands: https://docs.claude.com/en/docs/claude-code/slash-commands
- Claude Desktop MCP: https://modelcontextprotocol.io/quickstart/user

### 宿主支持范围

宿主列表持续扩展，不在规格中写死。安装器通过宿主适配层（Host Adapter）支持任意宿主，已知宿主标识举例：

| 宿主 | 标识 |
|------|------|
| Cursor | `cursor` |
| Claude Code | `claude-code` |
| Claude Desktop | `claude-desktop` |
| （后续持续新增…） | — |

各宿主对资产类型的支持情况由其 Host Adapter 声明；安装器在安装前与能力矩阵做交叉，自动决定哪些资产写入、哪些跳过并告知用户。

### Sub-agent 跨宿主安装

Sub-agent 源文件使用各宿主通用的标准 Markdown + YAML frontmatter 格式。Pack 作者可在 frontmatter 中添加 `agent-get/` 命名空间前缀的字段，作为安装器提示（宿主会忽略它不认识的字段）。**严禁覆盖宿主原生字段的值**（如直接改写 `model` 的值），因为这会破坏源文件对其他宿主的兼容性。

```markdown
---
name: code-reviewer
description: Code review specialist. Use after code changes.
model: inherit
agent-get/cursor/model: fast
agent-get/claude-code/model: haiku
---

You are a senior code reviewer...
```

安装器读取 `agent-get/<host>/model` 字段，在**写入目标宿主时**将 `model` 字段替换为对应值，而不修改源文件本身。

| 宿主 | 安装目录 |
|------|---------|
| Cursor | `.cursor/agents/` |
| Claude Code | `.claude/agents/` |

`agent-get/*` 字段在写入目标宿主时会被剥离，最终落盘的文件是干净的宿主原生格式。

### 安装行为

**宿主选择**：未指定 `--host` 时行为取决于运行环境：
- **TTY 环境**：弹出交互式选择界面；扫描当前工作目录及父目录特征路径探测已安装宿主，探测结果置顶供快速确认；用户可从完整列表手动选择其他宿主
- **非 TTY 环境**（CI、管道等）：报错退出（exit 2），提示"非交互环境中请使用 `--host` 指定目标宿主"，不自动选择任何宿主

**幂等性**：通过目标宿主当前文件状态判断，而非安装记录。重复安装时：
- 不产生重复配置项
- 不重复写入相同内容
- 输出"已存在/已更新/冲突"说明

**冲突处理**：
- 目标宿主同名配置已存在时：输出冲突信息，不覆盖用户手动修改的内容
- 宿主不支持某资产类型时：跳过并在摘要中说明原因

**安装摘要**（每次安装必须输出）：
- 安装的包名、来源
- 目标宿主
- 已写入的资产及目标路径
- 跳过的资产及原因

**首版不支持**：`list`、`remove`、`update`、安装状态记录

---

## User Scenarios & Testing

### User Story 1 - 一条命令安装完整能力包 (Priority: P1)

用户通过 `agent-get --pack <source>` 将一个包含多类资产的 Agent Pack 安装到目标 AI Agent 宿主中。这是本产品的核心价值：不再需要用户分别手动安装 MCP、Skill、Prompt、Command、Sub-agent，一条命令完成全部资产安装与配置写入。

**Independent Test**：准备一个包含 MCP、Skill、Prompt、Command、Sub-agent 的 `agent-pack.json`，对 Cursor 和 Claude Code 分别执行 `agent-get --pack ./agent-pack.json`，验证各类资产均正确写入且宿主配置可用。

**Acceptance Scenarios**：

1. **Given** 当前项目使用 Cursor，Pack 包含 MCP、Skill、Prompt、Command、Sub-agent，**When** 执行 `agent-get --pack ./agent-pack.json --host cursor`，**Then** 所有资产写入 Cursor 对应位置，输出包含每类资产写入路径的安装摘要。
2. **Given** 未指定 `--host`，**When** 执行安装命令，**Then** CLI 弹出交互式宿主选择界面，自动探测结果置顶，用户选择后继续安装，不静默写入。
3. **Given** 同一 Pack 已安装过，**When** 再次执行 `agent-get --pack` 同一来源，**Then** 不产生重复配置，摘要说明各资产"已存在/已更新"状态。
4. **Given** 当前宿主（如 `claude-desktop`）不支持某资产类型（如 Sub-agent），**When** 执行安装，**Then** 不支持的资产被跳过，其他资产正常安装，摘要明确说明跳过原因。
5. **Given** Pack 中含带有 `agent-get/cursor/model: fast` 和 `agent-get/claude-code/model: haiku` 的 Sub-agent，**When** 分别向 Cursor 和 Claude Code 安装，**Then** 各宿主副本中 `model` 字段已按提示填充，`agent-get/*` 字段已剥离，源文件内容保持不变。

---

### User Story 2 - 直接安装单个资产来源 (Priority: P1)

用户无需将资产先封装为完整 Pack，可直接通过资产类型 flag 安装一个或多个已有资产来源；不同类型的 flag 可以组合使用，同一 flag 也可重复传入。

**Independent Test**：执行 `agent-get --skill git@github.com:pea3nut/xxxx.git --host claude-code`，验证 Skill 被写入 Claude Code 的 skills 目录。

**Acceptance Scenarios**：

1. **Given** 用户有一个 Git 来源的 Skill 仓库，**When** 执行 `agent-get --skill git@github.com:pea3nut/xxxx.git --host claude-code`，**Then** Skill 被写入 Claude Code 宿主 skills 目录，不要求该来源先封装为 Pack。
2. **Given** 用户想同时安装两个 Skill 和一个 MCP，**When** 执行 `agent-get --skill git@github.com:demo/skill-a.git --skill git@github.com:demo/skill-b.git --mcp ./playwright.json`，**Then** 三个资产均被安装，摘要分别列出各自的写入结果。
3. **Given** 用户同时传入 `--pack ./agent-pack.json --skill git@github.com:extra/skill.git`，**When** 执行命令，**Then** Pack 中的所有资产和额外的 Skill 均被安装，摘要合并列出全部写入结果。

---

### User Story 3 - 标准化的能力包描述格式 (Priority: P1)

能力提供方通过声明式 Manifest 描述一个 Agent Pack 的内容（资产清单、来源等），由安装器负责将其映射到不同宿主的配置和目录结构，而不是为每个宿主分别手工维护安装说明。

**Independent Test**：编写包含全部 5 种资产类型的 `agent-pack.json`，执行 `agent-get --pack ./agent-pack.json` 后验证安装计划与 Manifest 内容一致。

**Acceptance Scenarios**：

1. **Given** Manifest 声明了 MCP、Skill、Prompt、Command、Sub-agent，**When** CLI 解析 Manifest，**Then** 能识别每类资产及其来源。
2. **Given** Manifest 包含 `references` 资产类型（首版不支持），**When** CLI 解析 Manifest，**Then** 在解析阶段报错"不支持的资产类型"，不静默忽略。
3. **Given** Manifest 中 `assets[].source` 为数组 `["git@github.com:a.git", "https://github.com/a.git"]`，**When** CLI 解析，**Then** 两个来源均被安装，等价于分别传入两次 `--skill`。

---

### User Story 4 - TTADK 插件兼容路径 (Priority: P3)

TTADK 现有插件（`plugin = mcp + skills + references + scripts + knowledges + ...`）与 Agent Pack 高度语义重叠。本功能需要在文档层面明确两者的字段映射关系、兼容范围和非兼容范围，为后续可能的迁移或统一提供基础，但首版不要求自动迁移所有现有插件。

**Independent Test**：选取 `plugins/tns/fe-common/` 做字段映射演练，验证映射文档的可操作性。

**Acceptance Scenarios**：

1. **Given** 团队已有 TTADK 插件，**When** 对照映射文档进行字段映射分析，**Then** 能判断哪些字段直接继承、哪些需要扩展、哪些首版不支持。
2. **Given** 首版不支持 TTADK 全量能力，**When** 阅读规格文档，**Then** 文档清晰说明兼容范围与非目标范围，不存在"是否迁移不确定"的歧义。

---

### Edge Cases

- **宿主选择**：未指定 `--host` 时：TTY 环境下弹出交互式选择界面（探测结果置顶）；非 TTY 环境（CI/管道）下报错退出（exit 2），要求显式指定 `--host`
- **宿主不支持资产类型**：跳过并在摘要说明原因，不导致整体安装失败
- **宿主配置已有用户手动修改**：不覆盖无关内容；对冲突内容输出明确说明
- **重复安装**：通过目标文件当前状态判断幂等，不依赖安装记录；已存在内容不重复写入
- **多 flag 组合**：所有 flag 可任意组合（`--pack a.json --skill b --mcp c`），每项均独立安装，摘要合并输出
- **来源不可访问 / 版本不存在**：输出可操作的错误提示（来源地址、失败原因、可选建议）
- **Manifest 不合法**：解析阶段失败，报出具体字段错误，不进行任何写入
- **含不支持资产类型**：解析阶段报错，不静默忽略，不产生脏状态
- **安装中途失败**：不保留半写入状态；输出已写入内容和失败位置
- **source 内容与声明类型不匹配**：安装前校验，报错说明期望类型与实际内容的差异；`--skill` source 目录不含 `SKILL.md` 时属于此类，报错退出（exit 2）

---

## Requirements

### Functional Requirements

**CLI 接口**：
- FR-001：`agent-get` 本身即为安装入口，无需 `install` 子命令；首版不支持 `list`、`remove`、`update`
- FR-002：`--pack` 的值 MUST 是指向 Manifest JSON 文件的路径或 URL，支持本地路径、Git SSH、Git HTTPS、直接 HTTP(S) URL 四种形式；MUST NOT 支持 Registry 引用
- FR-003：`agent-get` MUST 支持 `--pack`、`--mcp`、`--skill`、`--prompt`、`--command`、`--sub-agent` 六种 flag
- FR-004：所有 flag（`--pack`、`--mcp`、`--skill`、`--prompt`、`--command`、`--sub-agent`）可任意组合，同一 flag 可重复传入，每个 source 均独立安装
- FR-005：`--host` 未指定时：若检测到 TTY（`process.stdout.isTTY === true`），MUST 弹出交互式宿主选择界面，通过扫描当前工作目录及父目录特征路径自动探测已安装宿主并置顶，用户确认或选择后继续；若非 TTY（如 CI、管道），MUST 报错退出（exit 2）并提示"非交互环境中请使用 `--host` 指定目标宿主"，MUST NOT 自动选择
- FR-006：系统 MUST 提供稳定的 `--help` 输出，内容与本规格"产品定义 - CLI 命令面"节的快照一致

**Manifest 与 Source**：
- FR-007：Manifest `assets[].source` 格式 MUST 与 CLI 参数格式语义完全对齐
- FR-008：`source` 数组中每个元素均代表一个独立资产来源，每项均执行安装
- FR-009：系统 MUST 自动检测 source URI 类型，MUST NOT 要求用户配置 `kind`、`priority`、`checksum` 等字段
- FR-009a：`--mcp` 的 source JSON 文件 MUST 采用与宿主原生 `mcpServers[name]` 值对象一致的格式（含 `command`/`args`/`env` 等字段）；安装器 MUST 将其以该 MCP 的名称注入目标宿主配置文件的 `mcpServers` 块
- FR-010：系统 MUST 支持本地路径、Git SSH、Git HTTPS、直接 HTTP(S) URL 四种 URI 形式；Git URL MUST 支持 `#path` 语法指定仓库内子目录；直接 HTTP(S) URL 用于获取单个文件（如 MCP 配置 JSON），MUST NOT 支持 Registry 包名形式
- FR-011：`source` MUST 支持单值字符串和多值字符串数组
- FR-012：Manifest 含不支持资产类型时 MUST 在解析阶段报错，MUST NOT 静默忽略

**资产类型**：
- FR-013：首版 MUST 支持 `mcp`、`skill`、`prompt`、`command`、`subAgent` 五种资产类型
- FR-014：`prompt` 与 `command` MUST 作为不同资产类型处理；`prompt` 专指写入宿主基础规则文件（如 `CLAUDE.md`、`AGENTS.md`）的内容；写入时 MUST 将内容追加至文件末尾并用标记块包裹（格式：`<!-- agent-get:pack-name -->...<!-- /agent-get:pack-name -->`）；标记块已存在时 MUST 视为"已存在"跳过或更新，MUST NOT 重复追加
- FR-015：首版 MUST NOT 支持 `references`、`knowledges`、`scripts`、`templates`、`resources`

**宿主适配**：
- FR-016：系统 MUST 通过宿主适配层处理不同 Agent 的路径、配置格式和能力差异；首版支持宿主的资产路径由 `src/hosts.json` 静态配置定义，详见"产品定义 - 宿主能力矩阵"节
- FR-017：`subAgent` 安装时 MUST 将源文件复制到目标宿主对应目录，MUST NOT 修改源文件本身；写入宿主的副本应用 `agent-get/<host>/*` 字段提示，并在落盘前剥离所有 `agent-get/*` 字段
- FR-018：`agent-get/` 命名空间字段 MUST 在写入宿主副本时被剥离；MUST NOT 覆盖源文件中已有宿主原生字段的值（如不得直接改写已有的 `model` 字段），只允许在宿主副本中基于 `agent-get/*` 提示填充默认值
- FR-019：宿主不支持某资产类型时 MUST 跳过并在摘要说明，MUST NOT 导致整体安装失败

**安装行为**：
- FR-020：系统 MUST 具备幂等性，通过目标文件当前状态判断，MUST NOT 依赖安装记录
- FR-021：系统 MUST 在每次安装后输出结构化摘要，包含宿主、来源、写入资产列表、跳过资产列表
- FR-022：系统 MUST 对安装过程中的错误（Manifest 非法、来源不可用、类型不匹配等）提供可操作的错误提示
- FR-023：首版 MUST NOT 维护安装状态文件，MUST NOT 支持依赖安装记录的管理命令

### Key Entities

- **Agent Pack**：一组可被统一安装的能力资产集合（MCP + Skill + Prompt + Command + Sub-agent）
- **Agent Pack Manifest**：Pack 的声明式元数据文件，描述资产清单和来源
- **Asset Descriptor**：Manifest 中单个资产的定义（`type`、`source`）；资产名称由安装器从 source 路径自动推断，无需在 Manifest 中声明
- **Source**：资产来源，格式为字符串或字符串数组；支持本地路径、Git SSH、Git HTTPS、直接 HTTP(S) URL 四种 URI 形式，类型自动检测；不支持 Registry 包名
- **MCP Config File**：描述单个 MCP server 的 JSON 配置文件，格式与宿主原生 `mcpServers[name]` 的值对象一致（如 `{"command": "npx", "args": [...], "env": {...}}`）；安装器将其注入目标宿主配置文件
- **Prompt Asset**：写入宿主基础规则文件（`CLAUDE.md`、`AGENTS.md`）的内容资产，与 Command 严格区分；以标记块包裹追加写入，格式为 `<!-- agent-get:pack-name -->...<!-- /agent-get:pack-name -->`，支持幂等判断
- **SubAgent**：标准 Markdown + YAML frontmatter 格式；可在 frontmatter 中添加 `agent-get/<host>/*` 字段作为安装提示；安装器写入宿主副本时应用提示并剥离 `agent-get/*` 字段，不修改源文件
- **Host Adapter**：宿主适配层，负责将逻辑资产映射到具体宿主的目录、配置文件和写入策略
- **Install Summary**：安装结果摘要，包含宿主、来源、写入资产列表、跳过资产列表

---

## Assumptions

- 宿主列表持续扩展，不在规格中写死；安装器通过插件化 Host Adapter 支持任意宿主
- 首版 CLI 优先解决"安装"问题，不承担已安装内容的管理职责
- `prompt` 与 `command` 是不同资产类型，不合并处理
- `source` 的 URI 类型由安装器自动检测，不要求用户声明
- TTADK `plugin` 与 Agent Pack 高度语义重叠，但首版不强制统一，通过文档级映射说明兼容路径

---

## Success Criteria

- **SC-001**：开发者可通过单条命令，在至少 2 类不同宿主上完成含多类资产的 Pack 安装，无需手动编辑宿主配置
- **SC-002**：内部试用中，90% 场景下开发者可在 5 分钟内完成首次安装与基础验证
- **SC-003**：对同一 Pack 重复执行安装，100% 的用例中不产生重复配置或重复文件写入
- **SC-004**：新用户仅通过 `--help` 文本即可独立完成至少一个 Pack 安装示例和一个单资产安装示例
- **SC-005**：Sub-agent 资产在至少 2 类宿主（Cursor、Claude Code）上均能成功安装，源文件内容保持不变
- **SC-006**：团队能基于文档清晰判断 TTADK 现有插件与 Agent Pack 的兼容范围，消除"是否迁移不确定"的讨论歧义
