# Feature Specification: 扩展宿主支持

**Feature Branch**: `002-more-hosts`
**Created**: 2026-03-17
**Status**: Draft

---

## Clarifications

### Session 2026-03-17

- Q: `--pack` 安装时宿主不支持某资产类型，应跳过还是报错退出？ → A: **跳过并摘要说明**（保持首版行为）。Pack 中的资产类型由 Pack 作者控制、用户无法改动，强制报错会导致跨宿主 Pack 无法使用；显式 CLI flag（`--skill` 等）目标明确，不支持时仍报错退出
- Q: Qwen Code、Tabnine CLI、Kimi Code 的 Prompt 路径待确认，如何处理？ → A: 查阅官方文档后确认：Qwen Code 使用 `AGENTS.md`（`append-with-marker`）；Tabnine CLI 使用 `.tabnine/guidelines/<name>.md`（`create-file-in-dir`）；Kimi Code 使用 `AGENTS.md`（`append-with-marker`）。三者均支持 Prompt，本次全部实现
- Q: `reason` 字段缺失时的回退行为？错误提示语言？ → A: `reason` 为空时回退通用文案 `"This asset type is not supported by this host."`；所有 CLI 错误提示均使用**英文**
- Q: `hosts.json` 与宿主配置的架构走向？ → A: **`hosts.json` 完全删除**。每个宿主实现独立的 TypeScript Adapter 类（实现共同的 `HostAdapter` 接口），配置（路径、写入策略等）硬编码在各自 Adapter 类内；`src/hosts/index.ts` 只保留 `hostId → HostAdapter` 的注册映射。

---

## 背景与目标

`agent-get` 首版仅支持 3 个宿主（Cursor、Claude Code、Claude Desktop），而 AI Agent 生态已远不止于此。[spec-kit](https://github.com/github/spec-kit) 支持 22+ 宿主，用户在不同 IDE、CLI Agent 间切换已是常态。

当前痛点：
- 用户对 Windsurf、Gemini CLI、Codex 等宿主执行 `agent-get` 时，会因为 `--host` 无法识别而报错，体验差
- 现有宿主能力矩阵散落在代码中（`src/hosts.json`），缺少人类可读的权威文档，贡献者难以知晓"新宿主应该填什么字段"
- 宿主不支持某资产类型时，当前行为是静默跳过，用户无法知道"为什么我的 Skill 没有安装"

**本功能**在保持首版架构不变的前提下，完成三件事：
1. **扩展宿主列表**：将 spec-kit 支持列表中文档完善的宿主全部接入
2. **建立唯一可信来源**：`src/hosts/README.md` 作为宿主支持现状的权威文档，所有宿主适配器的能力声明均源自此文档
3. **不支持时主动提示**：资产类型被指定宿主明确标记为"不支持"时，安装器必须拒绝安装并给出可操作的提示，引导用户确认宿主能力、参与更新或提交 PR

---

## 产品定义

### `src/hosts/README.md` — 唯一可信来源

`src/hosts/README.md` 是宿主支持状态的唯一权威来源，具备以下特征：

- **人类可读**：以 Markdown 表格展示每个宿主对各资产类型的支持情况和配置路径
- **权威性**：各宿主 Adapter 类中硬编码的配置必须与此文档保持一致；贡献者通过 PR 同步更新 README.md 和对应 Adapter 类
- **贡献指引**：文档内置"如何新增宿主"说明，包含需要新建 Adapter 类、在注册表注册、更新 README 和添加测试的完整步骤
- **可链接**：错误提示中直接引用此文档的 GitHub URL，方便用户一键跳转

**文档结构**：
```markdown
# Agent-get 宿主支持矩阵

## 支持状态说明
...

## 完整能力矩阵
| 宿主 | 标识 | MCP | Prompt | Skill | Command | Sub-agent |
...

## 各宿主详细配置
### Cursor
- MCP: https://cursor.com/help/customization/mcp
- Prompt: https://docs.cursor.com/context/rules
- Skill: https://docs.cursor.com/context/commands
- Command: https://docs.cursor.com/context/commands
- Sub-agent: https://docs.cursor.com/context/rules
...

## 如何新增宿主支持（贡献指南）
...
```

### 不支持时的拒绝行为

当用户指定了某个资产类型，但目标宿主明确声明不支持该资产类型时（`supported: false`），安装器必须：

1. **立即报错退出**（exit 2），不进行任何写入
2. 输出包含以下信息的错误提示：
   - 宿主名称和资产类型
   - 不支持的原因（来自宿主能力声明中的 `reason` 字段）
   - `src/hosts/README.md` 的链接（供用户确认当前支持状态）
   - PR 贡献链接（引导用户提交支持新能力的 PR）

**示例错误输出**（有 reason 字段时）：
```
Error: Host "windsurf" does not support asset type "command".

Reason: Windsurf does not have a custom slash command mechanism equivalent to Command.

• View the full host capability matrix: https://github.com/.../src/hosts/README.md
• If you believe Windsurf now supports this, feel free to open a PR: https://github.com/.../pulls
```

**示例错误输出**（`reason` 字段缺失时）：
```
Error: Host "windsurf" does not support asset type "command".

Reason: This asset type is not supported by this host.

• View the full host capability matrix: https://github.com/.../src/hosts/README.md
• If you believe Windsurf now supports this, feel free to open a PR: https://github.com/.../pulls
```

> 注意：与首版"宿主不支持时跳过"行为的区别：首版跳过是指"安装 Pack 时某资产类型不被宿主支持，跳过该资产继续安装其他资产"（不中断整体流程）。本功能中，用户**明确通过 CLI flag 指定**了某个资产类型但宿主不支持，这是需要拒绝的——因为用户的意图明确，静默跳过会造成困惑。

### 支持的宿主范围

**本次全部接入**（按实现复杂度分组，但均在本功能范围内）：

**第一组**：MCP 使用标准 JSON 格式、配置路径清晰，对现有架构改动最小

| 宿主 | 标识 | 主要新增能力 | 文档 |
|------|------|------------|------|
| Windsurf | `windsurf` | MCP（全局）、Prompt（rules 目录）、Skill | https://docs.windsurf.com/windsurf/mcp |
| GitHub Copilot | `github-copilot` | MCP（`.vscode/mcp.json`）、Prompt（`copilot-instructions.md`） | https://docs.github.com/en/copilot/tutorials/enhance-agent-mode-with-mcp |
| Gemini CLI | `gemini` | MCP（`.gemini/settings.json`）、Prompt（`GEMINI.md`） | https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html |
| Roo Code | `roo-code` | MCP、Prompt（rules 目录）、Skill | https://docs.roocode.com/features/mcp/using-mcp-in-roo |
| Kilo Code | `kilo-code` | MCP、Prompt（rules 目录） | https://kilo.ai/docs/automate/mcp/using-in-kilo-code |
| Qwen Code | `qwen-code` | MCP、Prompt（`AGENTS.md`）、Skill | https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/ |
| opencode | `opencode` | MCP（`opencode.json`）、Prompt（`AGENTS.md`） | https://open-code.ai/docs/en/config |
| Augment | `augment` | MCP（全局）、Prompt（rules 目录） | https://docs.augmentcode.com/cli/integrations |
| Kiro CLI | `kiro` | MCP、Prompt（steering 目录） | https://kiro.dev/docs/cli/mcp/configuration/ |
| Tabnine CLI | `tabnine` | MCP、Prompt（`.tabnine/guidelines/` 目录） | https://docs.tabnine.com/main/getting-started/tabnine-agent/guidelines |
| Kimi Code | `kimi` | MCP（全局）、Prompt（`AGENTS.md`） | https://moonshotai.github.io/kimi-cli/en/customization/mcp.html |
| Trae | `trae` | MCP、Prompt（`.trae/project_rules.md`） | https://traeide.com/docs |
| OpenClaw | `openclaw` | MCP（全局）、Prompt（`AGENTS.md`）、Skill | https://openclawlab.com/en/docs/tools/skills-config/ |

**第二组**：需要新 MCP 写入适配器（TOML 格式），工程量稍大

| 宿主 | 标识 | 特殊说明 | 文档 |
|------|------|---------|------|
| Codex CLI | `codex` | MCP 为 TOML 格式（`[mcp_servers.<name>]` table）、Prompt（`AGENTS.md`） | https://developers.openai.com/codex/mcp |
| Mistral Vibe | `vibe` | MCP 为 TOML 格式（`[[mcp_servers]]` 数组追加） | https://docs.mistral.ai/mistral-vibe/introduction/configuration |

**暂缓（P3）**：文档极少，等待生态成熟

Jules、IBM Bob、CodeBuddy CLI、Qoder CLI、Antigravity

### 架构调整：Host Adapter 模式（替代 `hosts.json`）

`hosts.json` 在本功能中**完全删除**。宿主配置改为由各自的 TypeScript Adapter 类承载：

- **`HostAdapter` 接口**：所有宿主 Adapter 必须实现的共同 TypeScript 类型，包含 `id`、`displayName`、`docs`、`detection`、`assets`（`Record<AssetType, AssetCapability>`）等字段，以及资产路径计算与写入方法
- **各宿主 Adapter 类**：每个宿主在 `src/hosts/<host-id>.ts` 中实现 `HostAdapter` 接口，将配置路径、写入策略、支持能力等**硬编码**在类内；TOML 格式宿主（Codex、Mistral Vibe）在各自 Adapter 中封装相应的写入逻辑，无需共享字段标识格式
- **注册表**：`src/hosts/index.ts` 只保留 `Map<string, HostAdapter>`，key 为宿主标识（如 `'cursor'`），value 为对应 Adapter 实例；`getHost()`、`getAllHosts()`、`getValidHostIds()` 接口不变，调用方无感知

```
src/hosts/
  types.ts          ← HostAdapter 接口 + AssetCapability 类型（扩展 create-file-in-dir）
  index.ts          ← hostId → HostAdapter 注册映射（删除 hosts.json 引用）
  cursor.ts         ← CursorAdapter implements HostAdapter
  claude-code.ts    ← ClaudeCodeAdapter implements HostAdapter
  claude-desktop.ts ← ClaudeDesktopAdapter implements HostAdapter
  windsurf.ts       ← WindsurfAdapter implements HostAdapter
  ... (每个新宿主一个文件)
```

`AssetCapability` 类型随本功能新增 `writeStrategy: 'create-file-in-dir'` 值，其余字段向后兼容。

### 新增写入策略：`create-file-in-dir`

多个 P1 宿主（Windsurf、Roo Code、Kilo Code、Augment、Kiro）的 Prompt 写入模式是"在 rules 目录下新建一个 `.md` 文件"，而不是追加到固定文件。需在 `AssetCapability.writeStrategy` 新增此值：

- **策略名称**: `create-file-in-dir`
- **行为**: 在 `installDir` 指定目录下，以资产名称为文件名创建 `<name>.md`，内容即资产来源内容
- **幂等性**: 目标文件已存在时视为"已存在"跳过（或 `--force` 时覆盖）
- **与 `append-with-marker` 的区别**: 后者追加到单一文件；前者每个资产独立一个文件

### 新增 MCP 格式：TOML

Codex CLI 和 Mistral Vibe 使用 TOML 而非 JSON 配置 MCP。两者各自在 Adapter 类中独立实现 TOML 写入逻辑（`CodexAdapter` 写 `[mcp_servers.<name>]` table，`VibeAdapter` 追加 `[[mcp_servers]]` 条目），无需共享字段或共享实现。`AssetCapability` 类型不新增格式字段，向后完全兼容。

---

## User Scenarios & Testing

### User Story 1 - 安装到 P1 新宿主 (Priority: P1)

用户在 Windsurf、Gemini CLI 等新接入宿主中使用 `agent-get`，体验与 Cursor/Claude Code 一致。

**Independent Test**：执行 `agent-get --mcp ./playwright.json --host windsurf`，验证 MCP 被写入 `~/.codeium/windsurf/mcp_config.json`；执行 `agent-get --skill ./e2e-guide --host roo-code`，验证 Skill 被写入 `.roo/skills/e2e-guide/SKILL.md`。

**Acceptance Scenarios**：

1. **Given** 用户使用 Windsurf，**When** 执行 `agent-get --skill ./skills/e2e-guide --host windsurf`，**Then** Skill 被写入 `.windsurf/skills/e2e-guide/SKILL.md`，输出安装摘要。
2. **Given** 用户使用 Gemini CLI，**When** 执行 `agent-get --prompt ./dev-practices.md --host gemini`，**Then** 内容追加到项目根目录 `GEMINI.md`（marker 块包裹），不覆盖已有内容。
3. **Given** 用户使用 Kiro CLI，**When** 执行 `agent-get --prompt ./team-rules.md --host kiro`，**Then** 文件被写入 `.kiro/steering/team-rules.md`（新建文件），摘要输出写入路径。
4. **Given** 用户使用 GitHub Copilot，**When** 执行 `agent-get --mcp ./github.json --host github-copilot`，**Then** MCP 写入 `.vscode/mcp.json`，文件不存在时自动创建。
5. **Given** 用户使用 Roo Code，**When** 执行 `agent-get --skill ./e2e-guide --host roo-code`，**Then** Skill 被写入 `.roo/skills/e2e-guide/SKILL.md`，与 Cursor/Claude Code 的 Skill 安装行为一致。

---

### User Story 2 - 宿主不支持能力时拒绝并给出提示 (Priority: P1)

用户明确通过 CLI flag 指定了某个资产类型，但目标宿主不支持该类型，安装器拒绝执行并给出可操作的提示。

**Independent Test**：执行 `agent-get --skill ./skill-dir --host windsurf`（Windsurf 不支持 Command）实际上 Windsurf 支持 Skill，所以改为 `agent-get --command ./init.md --host windsurf`（Windsurf 不支持 Command），验证输出明确的错误提示和 PR 链接，进程以 exit 2 退出。

**Acceptance Scenarios**：

1. **Given** 目标宿主（如 `windsurf`）不支持 `command` 资产类型，**When** 执行 `agent-get --command ./init.md --host windsurf`，**Then** 输出错误提示（含宿主名、资产类型、原因、README 链接、PR 链接），进程以 exit 2 退出，不执行任何文件写入。
2. **Given** 目标宿主（如 `gemini`）不支持 `skill` 资产类型，**When** 执行 `agent-get --skill ./e2e-guide --host gemini`，**Then** 报错退出（exit 2），提示中包含指向 `src/hosts/README.md` 的链接供用户确认当前支持状态。
3. **Given** Pack Manifest 中包含 `command` 资产，目标宿主不支持 `command`，**When** 执行 `agent-get --pack ./agent-pack.json --host gemini`，**Then** `command` 资产被**跳过**，其余资产正常安装，摘要中说明跳过原因（`--pack` 保持首版跳过行为，不报错退出）。
4. **Given** 错误提示中包含 PR 贡献链接，**When** 用户点击链接，**Then** 能直达 GitHub PR 页面，链接格式正确、可访问。

---

### User Story 3 - `src/hosts/README.md` 作为唯一可信来源 (Priority: P1)

开发者、贡献者通过 `src/hosts/README.md` 能准确了解所有宿主的支持状态和配置路径，无需阅读代码。

**Independent Test**：打开 `src/hosts/README.md`，验证所有已接入宿主都有对应条目，能力矩阵与各宿主 Adapter 类中的配置一致；修改某宿主 Adapter 后，PR 审查确保 README 同步更新。

**Acceptance Scenarios**：

1. **Given** `src/hosts/README.md` 存在，**When** 打开文件，**Then** 能看到所有已接入宿主的完整能力矩阵表格（含宿主名、标识、各资产类型支持情况）和各宿主详细配置。
2. **Given** `src/hosts/README.md` 包含贡献指南，**When** 阅读该章节，**Then** 能根据说明独立完成一个新宿主的 PR，包含新建 Adapter 类、注册到 `index.ts`、更新 README 三步。
3. **Given** 错误提示中包含 README 链接，**When** 宿主不支持某资产类型时，**Then** 错误输出中的链接指向 `src/hosts/README.md` 对应章节（或文件顶部），用户可一键访问。

---

### User Story 4 - P2 宿主 TOML MCP 格式支持 (Priority: P2)

Codex CLI 和 Mistral Vibe 使用 TOML 格式配置 MCP，安装器能正确读写 TOML 配置文件。

**Independent Test**：执行 `agent-get --mcp ./playwright.json --host codex`，验证 `~/.codex/config.toml` 中出现 `[mcp_servers.playwright]` TOML table，格式正确；重复执行验证幂等性（不重复写入）。

**Acceptance Scenarios**：

1. **Given** 用户使用 Codex CLI，**When** 执行 `agent-get --mcp ./playwright.json --host codex`，**Then** MCP 配置以 TOML table `[mcp_servers.playwright]` 写入 `~/.codex/config.toml`，现有配置不受影响。
2. **Given** 用户使用 Mistral Vibe，**When** 执行 `agent-get --mcp ./playwright.json --host vibe`，**Then** MCP 配置以 `[[mcp_servers]]` 条目追加写入 `.vibe/config.toml`，不重复写入相同名称的条目。

---

### Edge Cases

- **P3 宿主被指定**：用户传入 `--host jules` 等未实现宿主，报错"未知宿主标识 'jules'"，在错误提示中说明当前已支持的宿主列表，并附 README 链接
- **新写入策略 `create-file-in-dir` 的目录不存在**：自动创建目录，不报错
- **新写入策略 `create-file-in-dir` 目标文件已存在**：视为"已存在"跳过，摘要标注；`--force` 时覆盖
- **TOML 配置文件格式损坏**：解析失败时报错并提示文件路径，不覆盖损坏文件
- **TOML 文件不存在**：自动创建，添加第一个 MCP 条目
- **全局 MCP 路径不存在父目录**（如 `~/.codeium/windsurf/`）：自动创建父目录
- **混合宿主安装**：`agent-get --skill ./e2e --host windsurf --host gemini`，Windsurf 支持 Skill，Gemini 不支持，应拒绝整个命令（任一宿主不支持即失败）还是仅对支持的宿主安装？→ **拒绝并报错**，明确告知哪个宿主不支持，不做部分安装
- **`--pack` 中含不支持资产类型**：Pack 安装沿用首版"跳过并摘要说明"行为（不改变）；仅 CLI 显式 flag 指定时才拒绝

---

## Requirements

### Functional Requirements

**`src/hosts/README.md` 唯一可信来源**：
- FR-100：`src/hosts/README.md` MUST 存在，包含所有已接入宿主的完整能力矩阵表格和各宿主详细配置说明
- FR-101：`src/hosts/README.md` MUST 包含贡献指南章节，说明新增宿主所需的所有步骤（新建 Adapter 类 + 注册到 `index.ts` + README 更新 + 测试要求）
- FR-102：`src/hosts/README.md` 中每个宿主的能力声明 MUST 与对应 Adapter 类中的硬编码配置保持一致；不一致属于文档缺陷，PR 审查时应捕获
- FR-103：错误提示中引用的 README 链接 MUST 指向 `src/hosts/README.md` 的 GitHub URL（可配置，如通过 `package.json` 的 `repository` 字段推断）

**不支持时的拒绝行为**：
- FR-104：用户通过 CLI 显式 flag（`--mcp`、`--skill`、`--prompt`、`--command`、`--sub-agent`）指定资产类型，且目标宿主的对应 `AssetCapability.supported === false` 时，系统 MUST 以 exit 2 退出，MUST NOT 进行任何文件写入
- FR-105：拒绝时的错误输出 MUST 包含：宿主标识与显示名称、资产类型名称、`reason` 字段内容（不支持原因，缺失时回退 `"This asset type is not supported by this host."`）、`src/hosts/README.md` 链接、GitHub PR 页面链接；所有错误提示文本均使用**英文**
- FR-106：多宿主场景下，任意一个宿主不支持显式指定的资产类型，MUST 报错退出，MUST NOT 对支持的宿主执行部分安装
- FR-107：`--pack` 安装时宿主不支持某资产类型，MUST 沿用首版"跳过并摘要说明"行为（不拒绝），此行为不受本功能影响

**架构调整**：
- FR-107a：`src/hosts.json` MUST 被删除；宿主配置 MUST 迁移至各自的 TypeScript Adapter 类，`src/hosts/types.ts` 中 MUST 定义 `HostAdapter` 接口
- FR-107b：`src/hosts/index.ts` MUST 仅保留 `hostId → HostAdapter` 注册映射，`getHost()`、`getAllHosts()`、`getValidHostIds()` 对外接口签名 MUST 不变

**第一组宿主接入**：
- FR-108：系统 MUST 支持以下 13 个第一组宿主标识：`windsurf`、`github-copilot`、`gemini`、`roo-code`、`kilo-code`、`qwen-code`、`opencode`、`augment`、`kiro`、`tabnine`、`kimi`、`trae`、`openclaw`
- FR-109：每个宿主 MUST 在 `src/hosts/<host-id>.ts` 中有独立的 Adapter 类实现 `HostAdapter` 接口，且该 Adapter 硬编码的配置 MUST 与 `src/hosts/README.md` 中的文档记录一致，README 中 MUST 包含该宿主的官方文档链接
- FR-110：`create-file-in-dir` 写入策略 MUST 被实现：在 `installDir` 指定目录下以 `<assetName>.md` 创建文件，目录不存在时自动创建

**第二组宿主接入**：
- FR-111：系统 MUST 支持以下 2 个第二组宿主标识：`codex`、`vibe`
- FR-112：Codex CLI 和 Mistral Vibe 的 TOML 写入逻辑 MUST 各自在其 Adapter 类中硬编码实现（`CodexAdapter` 写入 `[mcp_servers.<name>]` TOML table，`VibeAdapter` 追加 `[[mcp_servers]]` 条目），MUST NOT 引入共享的 TOML 格式字段
- FR-113：TOML MCP 写入 MUST 具备幂等性：相同名称的 MCP 条目已存在时不重复写入

**未知宿主**：
- FR-114：用户传入注册表中不存在的宿主标识时，MUST 报错"未知宿主标识 '...'"，错误信息中列出当前所有支持的宿主标识（或附 README 链接）

### Key Entities

- **`HostAdapter` 接口**：所有宿主必须实现的 TypeScript 接口（定义于 `src/hosts/types.ts`），包含 `id`、`displayName`、`docs`、`detection`、`assets` 等声明字段；各宿主在 `src/hosts/<host-id>.ts` 中实现，配置路径与能力矩阵均硬编码于此
- **Host 注册表**：`src/hosts/index.ts` 中维护的 `Map<string, HostAdapter>`，是运行时 hostId → Adapter 的唯一映射，替代已删除的 `hosts.json`
- **HostCapabilityMatrix**：`src/hosts/README.md` 中呈现的宿主 × 资产类型二维矩阵，是宿主支持状态的人类可读权威文档；各 Adapter 类中的硬编码配置 MUST 与此矩阵保持一致
- **`create-file-in-dir` 写入策略**：新增的 Prompt 写入模式，在指定目录下为每个 Prompt 资产创建独立文件（对应 Windsurf `.windsurf/rules/`、Roo Code `.roo/rules/`、Kilo Code `.kilocode/rules/`、Augment `.augment/rules/`、Kiro `.kiro/steering/` 等）
- **TOML MCP 格式**：Codex CLI 和 Mistral Vibe 使用的 MCP 配置格式，各自在对应 Adapter 类中独立实现，与标准 JSON 写入路径隔离
- **显式 Flag 安装**：用户通过 `--mcp`、`--skill`、`--prompt`、`--command`、`--sub-agent` 直接指定资产类型的安装模式，区别于通过 `--pack` 间接触发的资产安装

---

## Assumptions

- `src/hosts/README.md` 与各宿主 Adapter 类的一致性由 PR 审查和人工维护保证，本功能不实现自动 lint 检查（可作为后续 CI 任务）
- P3 宿主（Jules、IBM Bob 等）在本功能范围内标记为"未知宿主标识"，不做专门适配
- Amp 的 MCP 无固定配置文件路径（通过 CLI 命令管理），本功能暂不接入 Amp 的 MCP 安装，仅支持 Amp 的 Prompt/Skill；若 Amp 官方文档明确文件路径后可在 P2 接入
- `--pack` 安装时的"跳过"行为（首版）不变：Pack 意图是"尽可能安装所有支持的资产"，而显式 flag 意图是"必须安装这个资产"，两者语义不同
- 多宿主 flag（`--host cursor --host windsurf`）不在本功能范围内（首版不支持，仍为单宿主）

---

## Success Criteria

- **SC-100**：用户对任意 P1 新宿主执行 `agent-get --mcp`，安装成功率 ≥ 95%（在宿主已安装的环境下）
- **SC-101**：用户对不支持的资产类型执行安装，100% 收到包含 README 链接的明确错误提示，进程以 exit 2 退出
- **SC-102**：新贡献者仅阅读 `src/hosts/README.md` 的贡献指南，能独立完成一个新宿主的 PR（包含新建 Adapter 类、注册到 `index.ts`、更新 README 三步）
- **SC-103**：所有第一组宿主（13 个）和第二组宿主（2 个）在 `src/hosts/README.md` 中均有完整的能力矩阵条目、配置路径说明和官方文档链接，不存在空白条目
- **SC-104**：重复执行任意宿主的 MCP / Prompt / Skill 安装，100% 的用例中不产生重复写入（幂等性，包含新增的 `create-file-in-dir` 策略和 TOML MCP 格式）
