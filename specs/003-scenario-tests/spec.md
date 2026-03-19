# Feature Specification: Scenario Tests 测试体系

**Feature Branch**: `003-scenario-tests`
**Created**: 2026-03-17
**Status**: Draft

---

## Clarifications

### Session 2026-03-17

- Q: 现有 vitest 测试文件（tests/unit/、tests/contract/）和 vitest 配置应如何处理？ → A: 保留所有现有 vitest 测试原封不动，Scenario Tests 是新增内容而非替换；不改 vitest 配置。
- Q: Scenario Tests 的执行触发方式是什么？ → A: 通过 `.cursor/commands/exec-scenarios.md` 定义的 `/tns:exec-scenarios` Cursor 命令触发，由 `scenario-case-runner` 子代理执行；需要 `tests/features/scenario-run-config.md` 配置文件。
- Q: 幂等性场景（exists/conflict/updated）应独立成文件还是分散到各资产类型文件中？ → A: 分散内联，不单独建文件；每个资产类型的 .feature 文件末尾包含该资产的幂等 Scenario。
- Q: `scenario-run-config.md` 是否预提交到仓库？executor 如何配置？ → A: 预提交到仓库，使用 shell bash 执行器，开箱即用，无需使用者手动填写。
- Q: `@P0`/`@P1`/`@P2` tag 的划分标准是什么？ → A: core 正常安装路径（happy path）为 `@P0`；core 边界条件/错误处理/幂等场景为 `@P1`；host 热门宿主（Cursor、Claude Code）的基础安装 Scenario 为 `@P1`；host 非热门宿主（Claude Desktop 等）的 Scenario 为 `@P2`。
- Q: 移除 vitest 后 `npm test` 定位是什么？ → A: 不删除 vitest；现有 vitest 测试保留，Scenario Tests 作为补充层新增，`npm test` 继续运行 vitest，Scenario Tests 仅通过 AI `scenario-case-runner` Agent 手动触发。
- Q: FR-009 "全部 5 种资产类型" 与 FR-002 列出的 7 个 core .feature 文件不一致，fixture 应覆盖几种资产类型？ → A: 改为 6 种（mcp / skill / prompt / command / sub-agent / pack），`cli-basic` 仅测试 CLI 基础命令（--version/--help），不需要 fixture 文件。
- Q: SC-004 中的 "spec-001" 引用是笔误还是有意引用 001-agent-pack-installer 规格？ → A: 有意引用，SC-004 明确要求 tests/features/core/ 须覆盖 spec-001 产品需求中 User Story 1-3 的验收场景，文本无需更改。

---

## 背景与目标

现有测试体系包含两类 vitest 测试：合约测试（黑盒 CLI 调用）和单元测试（直接调用内部函数）。这两类测试均无法直接反映"安装行为"这一核心业务场景，且维护成本随宿主扩展而线性增长。

本功能在现有 vitest 测试体系之上**新增** Gherkin Scenario Tests 层：用 `.feature` 文件描述可观测的安装行为，由 AI `scenario-case-runner` Agent 手动触发执行，每个 Scenario 通过操作文件系统和运行真实 CLI 二进制完成验证。现有 vitest 单元测试和合约测试保持不变。

---

## User Scenarios & Testing

### User Story 1 - Core 测试集覆盖全部资产行为 (Priority: P1)

测试编写者需要一套覆盖所有资产类型、所有边界条件的核心测试集，以 Cursor 为参照宿主，当某个资产类型的行为发生变化时，能快速定位问题。

**Why this priority**: 核心业务逻辑的正确性是最高优先级，是其他一切的基础。

**Independent Test**: 仅运行 `tests/features/core/` 下的 Scenario，可以验证全部核心安装逻辑。

**Acceptance Scenarios**:

1. **Given** `tests/features/core/` 下存在 8 个 `.feature` 文件（cli-basic、mcp、skill、prompt、command、sub-agent、pack、idempotency），**When** 按文件查询测试列表，**Then** 能找到覆盖每类资产的完整 Scenario，包含正常路径和边界 case。
2. **Given** 某 core Scenario 需要 MCP 安装，**When** 查看该 Scenario 的 Given 步骤，**Then** 步骤描述了如何创建临时工作目录和 fixture 文件，不依赖真实用户环境。
3. **Given** 某 core Scenario 验证安装结果，**When** 查看 Then 步骤，**Then** 断言通过检查文件系统状态（文件是否存在、内容是否正确）实现，不依赖内部函数调用。

---

### User Story 2 - Host 测试集验证跨宿主基础兼容性 (Priority: P2)

测试编写者需要为每个宿主提供一组基础安装 Scenario，验证该宿主支持的全部资产类型均可成功安装，不重复 core 中的边界测试。

**Why this priority**: 随着宿主扩展（Windsurf、Zed 等），需要结构化方式覆盖多宿主差异，且不引入大量重复。

**Independent Test**: 仅运行 `tests/features/host/cursor.feature` 可以独立验证 Cursor 宿主的全部资产安装能力。

**Acceptance Scenarios**:

1. **Given** `tests/features/host/` 下存在 `cursor.feature`、`claude-code.feature`、`claude-desktop.feature` 三个文件，**When** 查看各文件，**Then** 每个文件只包含该宿主支持的资产类型的基础安装 Scenario，不含边界 case。
2. **Given** 需要新增宿主 `windsurf`，**When** 创建 `tests/features/host/windsurf.feature`，**Then** 无需修改任何 core 文件，只需在新文件中列出 Windsurf 支持的资产类型各一条 Scenario。
3. **Given** `claude-desktop.feature` 中有 MCP 安装 Scenario，**When** 执行该 Scenario，**Then** 通过环境变量将 Claude Desktop 配置目录重定向到临时目录，不写入真实用户配置文件。

---

### User Story 3 - 测试隔离：每个 Scenario 在独立临时目录中运行 (Priority: P1)

测试执行者需要每个 Scenario 都在完全隔离的临时目录中运行，以保证测试不互相干扰、不污染真实用户配置。

**Why this priority**: 测试隔离是 Scenario Tests 可靠性的前提，没有隔离就无法重复执行。

**Independent Test**: 连续执行同一 Scenario 两次，两次均成功，第二次不因第一次遗留文件而失败。

**Acceptance Scenarios**:

1. **Given** 一个 Cursor MCP 安装 Scenario 开始执行，**When** 执行 Given 步骤，**Then** 创建唯一临时工作目录，所有后续操作均在该目录内进行。
2. **Given** Scenario 执行完毕（无论成功或失败），**When** 结束，**Then** 临时目录被清除，不留下任何残余文件。
3. **Given** Claude Desktop 宿主的 Scenario 执行，**When** CLI 运行时，**Then** 通过 `AGENT_GET_HOME` 环境变量将 `os.homedir()` 重定向到临时目录，真实的 `~/Library/Application Support/Claude/` 不受影响。

---

### Edge Cases

- **CLI 未构建**：Scenario 执行前需确保 `dist/index.js` 已编译，否则 CLI 无法运行
- **source 指向相对路径**：Scenario 中 `--mcp ./playwright.json` 等相对路径以临时工作目录为基准，fixture 文件需提前复制进去
- **Claude Desktop 路径平台差异**：macOS 使用 `~/Library/`，Windows 使用 `%APPDATA%`，Linux 使用 `~/.config/`；`AGENT_GET_HOME` 环境变量在三个平台上均需生效
- **Git 来源的 Scenario**：需要真实网络访问，应标记 `@network` tag 与本地来源 Scenario 区分，可按需跳过
- **并发执行**：多个 Scenario 同时运行时，各自的临时目录必须互不重叠

---

## Requirements

### Functional Requirements

**测试组织**：

- FR-001：测试文件 MUST 存储为 Gherkin `.feature` 文件，路径在 `tests/features/` 下
- FR-002：`tests/features/core/` MUST 包含按资产类型划分的 7 个 `.feature` 文件：`cli-basic`、`mcp`、`skill`、`prompt`、`command`、`sub-agent`、`pack`；幂等性场景（exists/conflict/updated 状态）MUST 内联在各资产类型对应的 `.feature` 文件末尾，MUST NOT 单独建立 `idempotency.feature`
- FR-003：`tests/features/host/` MUST 包含每个已支持宿主的 `.feature` 文件，新增宿主只需新建对应文件，MUST NOT 修改 core 文件
- FR-003a：Scenario 的优先级 tag MUST 遵循以下标准：`@P0` 为 core 正常安装路径（happy path）；`@P1` 为 core 边界条件/错误处理/幂等场景，以及 host 热门宿主（Cursor、Claude Code）的基础安装 Scenario；`@P2` 为 host 非热门宿主（Claude Desktop 等）的 Scenario

**测试隔离**：

- FR-004：每个 Scenario 的 Given 步骤 MUST 创建独立临时工作目录，所有文件操作均在该目录内进行
- FR-005：Scenario 结束时 MUST 清理临时目录，无论 Scenario 成功还是失败
- FR-006：CLI 执行时 MUST 以临时工作目录作为工作目录（CWD），使 Cursor/Claude Code 的相对路径安装逻辑基于临时目录
- FR-007：系统 MUST 支持通过 `AGENT_GET_HOME` 环境变量覆盖 `os.homedir()` 返回值，使 Claude Desktop 安装路径可被重定向到临时目录

**Fixture 管理**：

- FR-008：`tests/fixtures/` MUST 存放所有 Scenario 所需的静态 fixture 文件
- FR-009：Fixture 文件 MUST 覆盖全部 6 种资产类型（mcp / skill / prompt / command / sub-agent / pack），包括：有效 MCP JSON、有效 Skill 目录（含 SKILL.md）、无效 Skill 目录（不含 SKILL.md）、Prompt .md、Command .md、含 `agent-get/*` 字段的 Sub-agent .md、完整 Pack Manifest JSON；`cli-basic` 仅测试 CLI 基础命令（`--version`/`--help`），不需要 fixture 文件
- FR-010：Scenario 中的 Given 步骤 MUST 将所需 fixture 文件复制到临时目录，MUST NOT 直接在 fixture 目录内修改文件

**执行方式**：

- FR-011：Scenario Tests MUST 通过 `/tns:exec-scenarios` Cursor 命令触发，由 `scenario-case-runner` 子代理执行；每个 Given/When/Then 步骤对应具体的 shell 命令或文件系统操作
- FR-011a：`tests/features/scenario-run-config.md` MUST 预提交到仓库，executor 配置为 shell bash（即 `bash-shell` 自定义 CLI 执行器），开箱即用；setup 步骤注入 `mktemp -d` 创建临时工作目录，teardown 步骤注入 `rm -rf` 清理
- FR-012：When 步骤中执行 CLI 时，MUST 使用已构建的二进制 `node <abs-path>/bin/agent-get.js`，MUST NOT 使用 `ts-node` 等开发时运行方式
- FR-013：Then 步骤中的断言 MUST 通过检查文件系统状态实现（文件是否存在、JSON 字段是否存在、文件内容是否包含特定字符串等），MUST NOT 依赖内部模块 API

**与现有测试共存**：

- FR-014：现有 `tests/unit/` 和 `tests/contract/` 目录下的 vitest 测试文件 MUST NOT 被修改或删除，Scenario Tests 与其并存
- FR-015：`vitest` devDependency 和 `vitest.config.ts` MUST NOT 被移除
- FR-016：`package.json` 中现有的 `test`、`test:contract`、`test:integration` 脚本 MUST NOT 被修改

### Key Entities

- **Scenario**：一个 `.feature` 文件中的单个测试场景，包含 Given/When/Then 步骤，对应一个具体的安装行为或边界条件
- **Fixture**：`tests/fixtures/` 中的静态测试数据文件，被 Scenario 的 Given 步骤复制到临时目录使用
- **Temp Working Directory**：每个 Scenario 独占的临时目录，模拟用户项目根目录，Cursor/Claude Code 的所有安装路径均相对于此目录
- **`AGENT_GET_HOME` 环境变量**：用于在测试中覆盖 `os.homedir()` 返回值，使 Claude Desktop 的绝对路径安装逻辑可重定向到临时目录

---

## Success Criteria

- **SC-001**：全部 Scenario 执行完毕后，开发者真实的 `~/.cursor/`、`~/.claude/`、`~/Library/Application Support/Claude/` 配置目录内容不发生任何变化
- **SC-002**：在 CI 环境中连续执行全部 Scenario 两次，两次结果相同，不因状态残留导致第二次失败
- **SC-003**：新增宿主时，只需在 `tests/features/host/` 新建一个 `.feature` 文件，无需修改任何 core 测试文件
- **SC-004**：`spec-001` 中 User Story 1-3 的全部 Acceptance Scenarios 均在 `tests/features/core/` 中有对应 Scenario 覆盖
- **SC-005**：所有 `@P0` Scenario（core 正常安装路径）在一次完整执行中无失败

---

## Assumptions

- 测试执行前 CLI 已完成构建（`npm run build`），`dist/index.js` 和 `bin/agent-get.js` 均存在
- Git 来源的 Scenario（需要网络访问）在首期不纳入 core 覆盖，仅以 `@network` tag 标注，按需执行
- Claude Desktop 的 Scenario 仅覆盖 macOS（`darwin`）平台，Windows/Linux 平台差异由后续迭代处理
- `AGENT_GET_HOME` 环境变量需对 `src/assets/mcp.ts` 做最小改动以支持，该改动属于本 feature 的实现范围
