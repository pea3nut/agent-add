# Implementation Plan: agent-get CLI

**Branch**: `001-agent-pack-installer` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)

---

## Summary

实现 `agent-get` CLI 工具：一条命令将 MCP、Skill、Prompt、Command、Sub-agent 等 AI 资产安装到 Cursor、Claude Code、Claude Desktop 等宿主。核心技术路径：Commander 解析 CLI flags → TTY 检测决定是否需要交互式宿主选择 → Zod 验证 Manifest → SourceResolver 解析来源（本地/Git SSH/Git HTTPS/直接 HTTP(S)）→ 安装前资产类型校验（Skill 必须含 SKILL.md）→ HostAdapter 写入 → 输出结构化安装摘要。

---

## Technical Context

**Language/Version**: TypeScript 5.x，编译目标 Node.js 18（CommonJS）

**Primary Dependencies**:
- `commander` — CLI 参数解析（repeatable flags）
- `@inquirer/select` — 交互式宿主选择菜单（仅 TTY 环境下调用）
- `zod` — Manifest JSON Schema 验证（TypeScript-first）
- `yaml` — 解析/修改 Sub-agent 的 YAML frontmatter（处理 `agent-get/<host>/*` 字段）
- `tsup` — TypeScript 打包构建工具（esbuild-based）
- `vitest` — 单元/集成/合同测试

**Storage**: 文件系统操作（Node.js `fs` + 原子写入策略）；无数据库；无安装状态文件

**Testing**: `vitest`，分三层：unit / integration / contract

**Target Platform**: macOS / Linux / Windows（Node 18+）；作为 npm 全局包发布

**Project Type**: CLI tool（npm package，`bin.agent-get` 入口）

**Performance Goals**: 本地资产安装 < 1s；Git/HTTP 来源 < 10s（网络环境依赖）

**Constraints**: 不维护安装状态文件；不支持 Registry 来源；首版不支持 list/remove/update；非 TTY 时必须显式指定 `--host`

**Scale/Scope**: 单机 CLI；首版支持 3 个宿主（cursor / claude-code / claude-desktop）

---

## Constitution Check

> 无 `.specify/memory/constitution.md`，跳过合规性门禁检查。

---

## Project Structure

### Documentation (this feature)

```text
specs/001-agent-pack-installer/
├── plan.md              # 本文件
├── research.md          # Phase 0 技术选型决策
├── data-model.md        # 实体定义与 Zod Schema
├── quickstart.md        # 开发环境搭建与手动测试指南
├── contracts/
│   ├── cli-contract.md       # CLI 外部接口合同
│   └── manifest-schema.json  # Manifest JSON Schema
└── tasks.md             # Phase 2 输出（/speckit.tasks 生成）
```

### Source Code (repository root)

```text
bin/
└── agent-get.js          # #!/usr/bin/env node；require('../dist/index.js')

src/
├── index.ts              # 入口：wires CLI → installer
├── cli.ts                # Commander setup、TTY 检测、flag 解析、--host 交互选择
├── installer.ts          # 安装编排：jobs 生成 → 校验 → 执行 → 汇总
├── hosts.json            # 静态宿主能力矩阵（已存在）
├── hosts/
│   ├── index.ts          # 宿主注册表、探测逻辑（扫描 CWD 特征路径）
│   ├── types.ts          # HostConfig、AssetCapability、HostDetection 类型
│   ├── cursor.ts         # Cursor：平台相关路径解析
│   ├── claude-code.ts    # Claude Code：平台相关路径解析
│   └── claude-desktop.ts # Claude Desktop：跨平台配置文件路径解析
├── assets/
│   ├── types.ts          # AssetHandler 接口：handle(job) → InstallResult
│   ├── mcp.ts            # MCP：浅合并注入 mcpServers JSON（原子写入）
│   ├── skill.ts          # Skill：校验 SKILL.md 存在性 → 复制目录到 installDir
│   ├── prompt.ts         # Prompt：追加 marker 块到 targetFile
│   ├── command.ts        # Command：复制 .md 到 commands 目录
│   └── sub-agent.ts      # SubAgent：复制 + 应用 agent-get/<host>/* hints + 剥离字段
├── source/
│   ├── index.ts          # SourceResolver：detect URI type → resolve → localPath
│   ├── local.ts          # 本地路径解析（resolve, validate）
│   ├── git.ts            # Git sparse checkout（child_process.execFile）
│   ├── http-file.ts      # 直接 HTTP(S) 单文件下载（Node 18 fetch API）
│   └── infer-name.ts     # 从 source 字符串推断资产名称
├── manifest/
│   ├── parser.ts         # loadManifest(source) → Manifest（parse + validate）
│   └── schema.ts         # Zod schema，导出 Manifest / AssetDescriptor 类型
└── utils/
    ├── fs.ts             # atomicWriteJSON、readJSONOrNull、ensureDir
    ├── detect-hosts.ts   # detectHosts(cwd) → HostConfig[]（扫描特征路径）
    └── summary.ts        # formatSummary(InstallSummary) → string；printSummary

tests/
├── unit/
│   ├── manifest/
│   ├── source/
│   │   ├── infer-name.test.ts
│   │   └── uri-detect.test.ts  # 含 http-file vs git-https 边界
│   └── utils/
├── integration/
│   ├── cursor/
│   ├── claude-code/
│   └── claude-desktop/
└── contract/
    └── cli.test.ts       # --help 快照、exit codes（含非 TTY exit 2）、摘要格式

tsup.config.ts
tsconfig.json
vitest.config.ts
```

---

## Complexity Tracking

*无架构合规性违规，跳过此节。*

---

## Architecture Overview

```
CLI Entry (bin/agent-get.js)
    │
    ▼
cli.ts (Commander)
    │  parse flags → CliInput
    │
    ├─ if --host missing:
    │     process.stdout.isTTY?
    │       YES → @inquirer/select (detectHosts 结果置顶)
    │       NO  → exit(2) "非交互环境中请使用 --host 指定目标宿主"
    │
    ▼
installer.ts (orchestration)
    │
    ├─ pack sources → manifest/parser.ts → Manifest → AssetDescriptor[]
    ├─ direct flags → AssetDescriptor[] (type + source)
    │
    ├─ for each AssetDescriptor × source string:
    │     source/infer-name.ts → assetName
    │     source/index.ts      → ResolvedSource
    │       ├─ 'local'      → source/local.ts
    │       ├─ 'git-ssh'    → source/git.ts (sparse checkout)
    │       ├─ 'git-https'  → source/git.ts (sparse checkout)
    │       └─ 'http-file'  → source/http-file.ts (Node 18 fetch → tmpfile)
    │
    ├─ PRE-INSTALL VALIDATION (before any writes):
    │     Skill: assert localPath contains SKILL.md → error if missing
    │     MCP/Prompt/Command/SubAgent: assert file exists and matches extension
    │
    ├─ for each ResolvedSource × host:
    │     host.assets[type].supported ? → create InstallJob : → skipped
    │
    ├─ for each InstallJob:
    │     assets/<type>.ts → InstallResult
    │
    └─ utils/summary.ts → print InstallSummary → exit(code)
```

---

## Key Design Decisions

| 决策 | 选择 | 依据 |
|------|------|------|
| CLI 框架 | `commander` | 轻量（60KB），repeatable flag 原生支持 |
| 交互提示 | `@inquirer/select`（仅 TTY） | Inquirer v9 模块化，CJS/ESM 双兼容 |
| **非 TTY 行为** | **exit 2，要求显式 `--host`** | **防止 CI 中意外安装到错误宿主** |
| Git 子路径 | shell out + sparse checkout | 私有仓库支持、无额外依赖 |
| HTTP 单文件 | Node 18 `fetch` API | 无需额外依赖 |
| TypeScript 构建 | `tsup` | 零配置单文件 CJS bundle |
| Manifest 验证 | `zod` | TypeScript-first，清晰错误信息 |
| assets 无 name 字段 | 从 source 路径推断 | 降低 Manifest 编写成本 |
| **Skill 来源校验** | **写入前验证 `SKILL.md` 存在** | **与 Edge Cases 一致，提前失败** |
| Sub-agent 宿主提示前缀 | `agent-get/<host>/<field>` | 与工具名一致，避免冲突 |
| JSON 写入 | 浅合并 + 原子写入 | 保留其他 key，防崩溃损坏 |
| 幂等判断 | key 存在性（3态） | 不覆盖用户手动修改 |
| 宿主配置 | `src/hosts.json` 静态文件 | 运行时只读，新宿主只需扩展 JSON |
| 状态记录 | 无 | spec FR-023 明确禁止 |

---

## Phase 0: Research

> **Status**: ✅ Complete — 见 [research.md](./research.md)

---

## Phase 1: Design & Contracts

> **Status**: ✅ Complete

- [data-model.md](./data-model.md)
- [contracts/cli-contract.md](./contracts/cli-contract.md)
- [contracts/manifest-schema.json](./contracts/manifest-schema.json)
- [quickstart.md](./quickstart.md)
- [src/hosts.json](../../src/hosts.json)
