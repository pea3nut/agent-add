# Tasks: agent-get CLI

**Input**: Design documents from `/specs/001-agent-pack-installer/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 / US2 / US3 / US4)
- Exact file paths included in each task

---

## Phase 1: Setup（项目初始化）

**Purpose**: 初始化 TypeScript 项目结构与工具链配置

- [X] T001 创建 `tsconfig.json`（target: ES2022, module: commonjs, strict: true, outDir: dist）
- [X] T002 创建 `tsup.config.ts`（单文件 CJS bundle，入口 src/index.ts，clean: true）
- [X] T003 创建 `vitest.config.ts`（三个 test 目录：unit、integration、contract）
- [X] T004 [P] 安装运行时依赖：`commander @inquirer/select zod yaml`（确认 package.json bin.agent-get 字段）
- [X] T005 [P] 安装开发依赖：`tsup vitest @types/node typescript`
- [X] T006 在 `package.json` 补全 `scripts`：`build`、`dev`、`test`、`test:contract`、`test:integration`
- [X] T007 创建 `bin/agent-get.js`（`#!/usr/bin/env node` shebang + `require('../dist/index.js')`）

---

## Phase 2: Foundational（所有 User Story 依赖的核心基础）

**Purpose**: 类型定义、宿主能力矩阵、来源解析、工具函数、Manifest Schema——所有 User Story 的共同依赖

**⚠️ CRITICAL**: 所有 User Story 实现必须等本阶段完成后才能开始

- [X] T008 [P] 定义宿主类型 `src/hosts/types.ts`（`HostConfig`、`AssetCapability`、`HostDetection`、`AssetType` 接口）
- [X] T009 [P] 定义资产处理器接口 `src/assets/types.ts`（`AssetHandler`、`InstallJob`、`InstallResult`、`InstallStatus` 类型）
- [X] T010 [P] 实现原子写入工具 `src/utils/fs.ts`（`atomicWriteJSON`、`readJSONOrNull`、`ensureDir`）
- [X] T011 实现宿主注册表 `src/hosts/index.ts`（读取 `hosts.json`、注册宿主列表、导出 `getHost(id)`）
- [X] T012 [P] 实现 Cursor 宿主适配器 `src/hosts/cursor.ts`（各资产类型目标路径解析，参照 `hosts.json`）
- [X] T013 [P] 实现 Claude Code 宿主适配器 `src/hosts/claude-code.ts`（各资产类型目标路径解析）
- [X] T014 [P] 实现 Claude Desktop 宿主适配器 `src/hosts/claude-desktop.ts`（跨平台 `claude_desktop_config.json` 路径，仅支持 MCP）
- [X] T015 [P] 实现宿主探测工具 `src/utils/detect-hosts.ts`（`detectHosts(cwd)`：扫描 CWD 及父目录特征路径，返回已探测宿主列表）
- [X] T016 [P] 实现安装摘要工具 `src/utils/summary.ts`（`formatSummary`、`printSummary`，格式与 `contracts/cli-contract.md` 摘要规范一致）
- [X] T017 [P] 实现来源名推断 `src/source/infer-name.ts`（`inferName(source): string`，覆盖 data-model.md 中的 4 条推断规则）
- [X] T018 [P] 实现来源 URI 检测 `src/source/index.ts`（`detectSourceType`：local / git-ssh / git-https / http-file；含 `resolveSource` 编排框架）
- [X] T019 [P] 实现本地来源解析 `src/source/local.ts`（`path.resolve` + 存在性校验 + 返回 `ResolvedSource`）
- [X] T020 [P] 实现 Git 来源解析 `src/source/git.ts`（`child_process.execFile` + sparse checkout，支持 `#path` 语法，git-ssh 与 git-https 共用）
- [X] T021 [P] 实现 HTTP(S) 单文件下载 `src/source/http-file.ts`（Node 18 `fetch` API → 写入 tmp 文件 → 返回 `ResolvedSource`）
- [X] T022 [P] 实现 Manifest Zod Schema `src/manifest/schema.ts`（`ManifestSchema`、`AssetDescriptorSchema`，与 `contracts/manifest-schema.json` 对齐）

**Checkpoint**: 基础层完成——可并行启动 US2 与 US3

---

## Phase 3: User Story 2 — 直接安装单个资产来源 (Priority: P1)

**Goal**: 用户无需 Manifest，直接通过资产类型 flag（`--mcp`、`--skill`、`--prompt`、`--command`、`--sub-agent`）安装一个或多个资产来源

**Independent Test**: 执行 `agent-get --skill git@github.com:pea3nut/xxxx.git --host claude-code`，验证 Skill 被写入 Claude Code 的 skills 目录

### Implementation

- [X] T023 [P] [US2] 实现 MCP 资产处理器 `src/assets/mcp.ts`（浅合并注入目标宿主 `mcpServers`；`atomicWriteJSON`；幂等判断：key 存在 → `exists`，值不同 → `conflict`）
- [X] T024 [P] [US2] 实现 Skill 资产处理器 `src/assets/skill.ts`（安装前校验 `SKILL.md` 存在性；目录完整复制到 `<installDir>/<name>/`；幂等判断：目录存在 → `exists`）
- [X] T025 [P] [US2] 实现 Prompt 资产处理器 `src/assets/prompt.ts`（追加 marker 块 `<!-- agent-get:<name> -->..<!-- /agent-get:<name> -->` 到目标文件末尾；marker 已存在 → `exists`；内容变更 → `updated`）
- [X] T026 [P] [US2] 实现 Command 资产处理器 `src/assets/command.ts`（复制 `.md` 到宿主 commands 目录；文件已存在且内容相同 → `exists`；内容不同 → `conflict`）
- [X] T027 [P] [US2] 实现 Sub-agent 资产处理器 `src/assets/sub-agent.ts`（复制 `.md`；应用 `agent-get/<host>/*` hints（如将 `agent-get/cursor/model` 值写入 `model` 字段）；落盘前剥离所有 `agent-get/*` 字段；不修改源文件）
- [X] T028 [US2] 实现安装编排核心 `src/installer.ts`（直接 flag 路径：`CliInput` → `AssetDescriptor[]` → 来源解析 → **写入前整体校验**（① Skill: SKILL.md 存在；② 其他: 文件存在 + 扩展名匹配；③ **http-file × skill 非法组合**：sourceType=`http-file` 且 assetType=`skill` 时直接 exit 2，提示"Skill 资产必须指向目录来源（本地路径或 Git URL），不支持直接 HTTP(S) URL"）→ `InstallJob[]` 生成（跳过宿主不支持的类型）→ 逐 job 执行处理器 → 收集 `InstallResult[]`）
- [X] T029 [US2] 实现 CLI 入口 `src/cli.ts`（Commander setup；调用 `.version(pkg.version)` 从 `package.json` 读取版本号以支持 `--version` 输出；TTY 检测：非 TTY 且无 `--host` → exit 2；TTY 交互选择（`@inquirer/select`，`detectHosts` 结果置顶）；所有资产 flags（repeatable）解析；调用 installer）
- [X] T030 [US2] 实现主入口 `src/index.ts`（调用 `src/cli.ts` 的 Commander 程序）

**Checkpoint**: US2 场景可独立端到端验证（`agent-get --mcp ./test.json --host cursor` 正常写入）

---

## Phase 4: User Story 3 — 标准化能力包描述格式 (Priority: P1)

**Goal**: Manifest 能被正确解析与校验；不支持的资产类型在解析阶段报错；source 数组中每个元素独立安装

**Independent Test**: 编写含全部 5 种资产类型的 `agent-pack.json`，执行 `agent-get --pack ./agent-pack.json` 后验证安装计划与 Manifest 内容一致

> **⚠️ 并行注意**：T031 可在 Phase 2 完成后立即启动（新文件，与 US2 无依赖冲突）。**T032 依赖 T028 完成**（扩展同一 `installer.ts`）；**T033 依赖 T029 完成**（扩展同一 `cli.ts`）——这两个任务必须在 US2 对应任务完成后串行执行。

### Implementation

- [X] T031 [P] [US3] 实现 Manifest 解析器 `src/manifest/parser.ts`（`loadManifest(source)`：来源解析 → 读取 JSON → Zod 校验 → 展开 source 数组 → 返回 `Manifest`；不支持的资产类型在此阶段 exit 2 报错）
- [X] T032 [US3] 在 `src/installer.ts` 添加 `--pack` 路径（调用 `loadManifest` → 合并到 `AssetDescriptor[]`；`--pack` 与直接 flag 可同时存在，摘要合并输出）**依赖 T028**
- [X] T033 [US3] 在 `src/cli.ts` 添加 `--pack` flag（repeatable；传入 installer）**依赖 T029**

**Checkpoint**: `agent-get --pack ./agent-pack.json --host cursor` 正常解析全部 5 类资产并输出安装计划

---

## Phase 5: User Story 1 — 一条命令安装完整能力包 (Priority: P1) 🎯 MVP

**Goal**: `agent-get --pack <source>` 一条命令完成多类资产安装，含交互选择宿主、幂等性、跳过不支持类型、Sub-agent 提示应用

**Independent Test**: 准备含 MCP、Skill、Prompt、Command、Sub-agent 的 `agent-pack.json`，对 Cursor 和 Claude Code 分别执行安装，验证各类资产均正确写入且宿主配置可用

### Implementation

- [X] T034 [US1] 验证场景 1：全类型资产 `--host cursor`，确认每类资产写入正确路径，输出含路径的安装摘要
- [X] T035 [US1] 验证场景 2：TTY 环境下未指定 `--host`，交互列表弹出，`detectHosts` 探测结果置顶
- [X] T036 [US1] 验证场景 3：重复安装幂等——不产生重复配置，摘要输出"已存在/已更新"状态
- [X] T037 [US1] 验证场景 4：`claude-desktop` 宿主下含 Sub-agent 的 Pack——不支持的资产被跳过，MCP 正常安装，摘要说明跳过原因
- [X] T038 [US1] 验证场景 5：含 `agent-get/cursor/model: fast` 的 Sub-agent 安装到 Cursor——写入副本中 `model: fast`，`agent-get/*` 字段已剥离，源文件内容不变

**Checkpoint**: US1 全部 5 个 Acceptance Scenarios 手动验证通过，MVP 可交付

---

## Phase 6: User Story 4 — TTADK 插件兼容路径 (Priority: P3)

**Goal**: 文档级说明 TTADK 现有插件与 Agent Pack 的字段映射关系，消除迁移不确定性

**Independent Test**: 选取 `plugins/tns/fe-common/` 做字段映射演练，验证映射文档可操作性

### Implementation

- [X] T039 [US4] 创建 `specs/001-agent-pack-installer/ttadk-compat.md`：列出 TTADK plugin 字段与 Agent Pack 字段的映射关系（直接继承、需扩展、首版不支持三类）
- [X] T040 [US4] 以 `plugins/tns/fe-common/` 为例填充映射演练章节，验证每个字段均有明确结论

**Checkpoint**: 团队可通过文档独立判断 TTADK 插件兼容范围，无需再讨论

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 跨故事改进、`--help` 快照对齐、关键边界测试

- [X] T041 [P] 补全 `--help` 文本，确保与 spec "CLI 命令面"节快照完全一致（FR-006 / SC-004）
- [X] T042 [P] 添加非 TTY exit 2 contract 测试 `tests/contract/cli.test.ts`（`process.stdout.isTTY=false` 时缺少 `--host` → stderr 含提示消息 + exit 2）
- [X] T043 [P] 添加 URI 类型检测 unit 测试 `tests/unit/source/uri-detect.test.ts`（含 http-file vs git-https 边界）
- [X] T044 [P] 添加 `inferName` unit 测试 `tests/unit/source/infer-name.test.ts`（覆盖 4 类 URI 推断规则）
- [X] T045 执行 `quickstart.md` 全部手动测试场景（Scenario 1-6）并记录结果
- [X] T046 [P] 运行 `npm run build`，确认 `dist/` 产物无报错；`npm link` 后执行 `agent-get --version` 与 `agent-get --help` 验证

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖，立即开始
- **Foundational (Phase 2)**: 依赖 Phase 1 完成——**阻塞所有 User Story**
- **US2 (Phase 3)**: 依赖 Phase 2 完成
- **US3 (Phase 4)**:
  - T031（`manifest/parser.ts`，新文件）→ 依赖 Phase 2，**可与 US2 并行**
  - T032（扩展 `installer.ts`）→ **依赖 T028 完成**，不可与 T028 并行
  - T033（扩展 `cli.ts`）→ **依赖 T029 完成**，不可与 T029 并行
- **US1 (Phase 5)**: **依赖 US2 + US3 均完成**（需要资产处理器 + Manifest 解析器）
- **US4 (Phase 6)**: 依赖 Phase 2 完成，可独立进行（纯文档）
- **Polish (Phase 7)**: 依赖 US1 完成

### User Story Dependencies

- **US2 (P1)**: Phase 2 后可开始——无跨故事依赖
- **US3 (P1)**: T031 可在 Phase 2 后立即开始（与 US2 并行）；T032 需等 T028 完成；T033 需等 T029 完成
- **US1 (P1)**: US2 + US3 均完成后才能开始——需要资产处理器与 Manifest 解析器
- **US4 (P3)**: Phase 2 后可独立进行——纯文档，无代码依赖

### Within Each User Story

- 资产处理器（T023-T027）互相独立，可并行实现
- installer.ts 和 cli.ts 依赖资产处理器完成
- 验证任务（T034-T038）依赖完整安装链路

### Parallel Opportunities

- Phase 1：T004、T005 可并行（不同 npm install）
- Phase 2：T008-T022 标记 [P] 的任务可全部并行（各自独立文件）
- Phase 3：T023-T027（各资产处理器）可并行
- Phase 2 完成后：T031 可与 US2 全部任务并行；T032 需等 T028；T033 需等 T029
- Phase 7：T041-T044、T046 可全部并行

---

## Parallel Example: Foundational Phase

```bash
# 以下任务可同时启动（各自独立文件）：
Task: "实现 Cursor 宿主适配器 src/hosts/cursor.ts"          # T012
Task: "实现 Claude Code 宿主适配器 src/hosts/claude-code.ts" # T013
Task: "实现 Claude Desktop 宿主适配器 src/hosts/claude-desktop.ts" # T014
Task: "实现来源名推断 src/source/infer-name.ts"              # T017
Task: "实现本地来源解析 src/source/local.ts"                 # T019
Task: "实现 Git 来源解析 src/source/git.ts"                  # T020
Task: "实现 HTTP(S) 单文件下载 src/source/http-file.ts"      # T021
Task: "实现 Manifest Zod Schema src/manifest/schema.ts"      # T022
```

## Parallel Example: US2 Asset Handlers

```bash
# 所有资产处理器可同时实现（各自独立文件）：
Task: "实现 MCP 资产处理器 src/assets/mcp.ts"         # T023
Task: "实现 Skill 资产处理器 src/assets/skill.ts"     # T024
Task: "实现 Prompt 资产处理器 src/assets/prompt.ts"   # T025
Task: "实现 Command 资产处理器 src/assets/command.ts" # T026
Task: "实现 Sub-agent 资产处理器 src/assets/sub-agent.ts" # T027
```

---

## Implementation Strategy

### MVP First (US2 → US3 → US1)

1. 完成 Phase 1（Setup）
2. 完成 Phase 2（Foundational）—— **关键阻塞点**
3. 完成 Phase 3（US2）：直接 flag 安装可用（`--mcp`、`--skill` 等）
4. **STOP & VALIDATE**：`agent-get --mcp ./test.json --host cursor` 可用
5. 完成 Phase 4（US3）：Manifest 解析与校验可用
6. 完成 Phase 5（US1）：`--pack` 全量安装可用 → **MVP 交付**
7. 完成 Phase 6（US4）：TTADK 兼容文档
8. 完成 Phase 7（Polish）

### Incremental Delivery

1. Setup + Foundational → 基础层就绪
2. +US2 → 直接 flag 安装可用（实用价值已具备）→ 内部使用
3. +US3 → Manifest 格式验证可用
4. +US1 → `--pack` 完整能力包安装可用 → **对外发布**
5. +US4 → TTADK 兼容路径明确

---

## Notes

- [P] = 不同文件、无上游未完成依赖——可并行
- [USn] 标签映射到 spec.md 中的 User Story 编号
- hosts.json 文件已存在（`src/hosts.json`），T011-T014 直接读取该文件
- Phase 5 的 T034-T038 是验证任务（非编码任务），用于确认 US1 Acceptance Scenarios 满足
- 每个 Checkpoint 标志一个可独立交付的增量
- 提交节奏建议：每个 Phase 完成后提交一次，资产处理器每个单独提交
