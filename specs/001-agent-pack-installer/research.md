# Research: agent-get CLI

**Branch**: `001-agent-pack-installer` | **Date**: 2026-03-17

---

## 1. CLI 参数解析框架

**Decision**: `commander`

**Rationale**: 对于"无子命令、多次重复同一 flag"的场景，`commander` 的 collector 函数模式（`.option('--mcp <source>', '...', collect, [])`) 直观且轻量（~60KB vs yargs 的 ~150KB+）。本项目结构简单（单命令 + 若干可重复 flag），不需要 yargs 的子命令系统。

**Alternatives considered**: `yargs`（功能更全但包体积大，适合大型多子命令 CLI）、`meow`（极简但不支持类型推断）。

---

## 2. 交互式宿主选择

**Decision**: `@inquirer/select`（Inquirer.js v9+ 模块化包）

**Rationale**: Inquirer v9 拆分为独立的小包，`@inquirer/select` 专注于单选列表，CJS/ESM 双模式支持，在 Node 18 下无兼容性问题，社区最活跃。

**Alternatives considered**: `prompts`（长期缺乏维护）、`clack`（设计偏向多步骤向导风格，对简单单选场景过重）。

---

## 3. 直接 HTTP(S) 单文件下载

**Decision**: Node 18 内置 `fetch` API，下载到临时文件

**Rationale**: Node 18 已原生支持 `fetch`，无需引入 `axios`、`node-fetch` 等依赖。适用于单文件资产（MCP JSON、Prompt/Command/SubAgent `.md`）的直接 URL 下载。不适用于 Skill（需要目录结构）。

```typescript
// 检测规则：https:// 开头，且不含 .git 且不含 #
// 下载到临时文件后作为 localPath 使用
const res = await fetch(url);
const content = await res.text();
fs.writeFileSync(tmpPath, content, 'utf8');
```

**Alternatives considered**: `axios`（增加依赖）、`node-fetch`（Node 18 已内置 fetch，无需使用）。

---

## 4. 名称推断（从 source 路径）

**Decision**: 独立模块 `src/source/infer-name.ts`，规则如下：

| 来源示例 | 推断名称 | 规则 |
|---------|---------|------|
| `./mcps/playwright.json` | `playwright` | 去掉目录和扩展名 |
| `git@github.com:org/repo.git#e2e-guide` | `e2e-guide` | `#path` 最后一段 |
| `git@github.com:org/repo.git#path/to/skill` | `skill` | `#path` 最后一段 |
| `git@github.com:org/repo.git`（无 `#`） | `repo` | 仓库名，去掉 `.git` |
| `https://example.com/playwright.json` | `playwright` | URL 最后一段，去掉扩展名 |

**Rationale**: Manifest 不再需要声明 `assets[].name`，降低编写成本；推断规则覆盖所有 URI 类型，结果确定性强，易于单元测试。

**Alternatives considered**: 保留 `name` 字段（增加 Manifest 编写负担，spec 明确不需要）。

---

## 6. Git 子路径获取

**Decision**: Shell out to git（`child_process.execFile`）+ sparse checkout

**Pattern**:
```bash
# 对于 git@github.com:org/repo.git#path/to/asset
git clone --filter=blob:none --sparse --depth=1 <repo_url> <tmpdir>
cd <tmpdir>
git sparse-checkout set path/to/asset
# 结果：tmpdir/path/to/asset 即为所需内容
```

**Rationale**: 直接调用 git 是 2026 年最可靠的方案，原生支持私有仓库（复用用户已有 SSH 密钥），sparse checkout 避免拉取整个仓库。`simple-git` 对 sparse-checkout 的封装并不比直接 shell out 更优雅，反而增加了依赖。`degit` 不支持任意子目录路径。

**Alternatives considered**: `simple-git`（增加依赖但无额外优势）、`degit`（不支持 `#path` 子路径）、直接完整克隆（对大仓库代价高）。

---

## 7. TypeScript 构建工具

**Decision**: `tsup`（基于 esbuild）

**Rationale**: 零配置即可输出单文件 CJS bundle，自动处理 shebang、tree-shaking。构建速度极快（<1s）。对 CLI 工具而言，打包为单文件比 `tsc` 输出多文件更适合 npm 分发（无需携带 `node_modules`）。

**Output**: `dist/index.js`（CJS，含 shebang）→ `bin/agent-get.js` 通过 `require('../dist/index.js')` 引用。

**Alternatives considered**: `tsc`（只转换类型，不打包，发布包需包含依赖）、`esbuild` 直接使用（需要更多配置）、`ncc`（@vercel/ncc，打包包含 node_modules，适合 vendoring 场景）。

---

## 8. Manifest 验证

**Decision**: `zod`

**Rationale**: TypeScript 优先，schema 定义即类型定义（零重复），`.safeParse()` 返回结构化错误，方便在 CLI 输出"第 N 个 asset 的 type 字段非法"。

**Alternatives considered**: `ajv`（适合复用已有 JSON Schema 文件，错误信息需手动格式化，用户体验较差）、手写校验（不可维护）。

---

## 9. JSON 配置文件写入策略

**Decision**: 浅合并 + 原子写入（tmp 文件 + `fs.renameSync`）

**Rationale**:
- **浅合并**：`{ ...existing, mcpServers: { ...existing.mcpServers, [name]: config } }` — 保留配置文件中其他顶层 key（Claude Desktop 的 `globalShortcut` 等），只操作 `mcpServers` 块。
- **原子写入**：先写 `.filename.tmp`，成功后 `fs.renameSync`，POSIX 原子操作避免写到一半崩溃导致 JSON 损坏。
- **不保留注释/格式**：这三个配置文件均由程序生成，无注释，`JSON.stringify(obj, null, 2)` 输出 2 空格缩进足够。

**Alternatives considered**: `write-file-atomic` npm 包（功能等同，增加不必要依赖）、`comment-json`（处理注释，这三个文件无注释场景无意义）。

---

## 10. MCP 幂等性判断

**Decision**: 仅检查 `mcpServers[name]` key 是否存在（三态：written / exists / conflict）

**三态定义**:
- `written`：key 不存在 → 写入
- `exists`：key 存在，值与来源**完全相同** → 静默跳过
- `conflict`：key 存在，值与来源**不同** → 输出冲突提示，保留现有值，不覆盖

**Rationale**: spec 明确"不覆盖用户手动修改的内容"，只比较 key 存在性会将用户的定制改动误判为冲突；比较值能区分"已正确安装"和"用户手动修改了"两种情况，给出更准确的提示。

---

## 11. Prompt 写入策略（Marker 块）

**Decision**: HTML 注释 marker 块，追加写入目标文件末尾

**Marker 格式**:
```
<!-- agent-get:<asset-name> -->
{内容}
<!-- /agent-get:<asset-name> -->
```

**幂等检测**: 扫描目标文件是否包含 `<!-- agent-get:<asset-name> -->`：
- 不存在 → 追加写入
- 存在，内容相同 → 跳过（`exists`）
- 存在，内容不同 → 冲突提示，不覆盖（`conflict`）

---

## 12. TTY 检测与非交互环境行为

**Decision**: `process.stdout.isTTY` 检测；非 TTY 时若无 `--host` → exit 2

**Rationale**: CI 环境下自动选择宿主有安装到错误宿主的风险，明确报错比静默行为更安全。`process.stdout.isTTY` 是 Node.js 内置属性，无需额外依赖，在 CI（GitHub Actions、Jenkins 等）中均为 `undefined` 或 `false`。

**实现**:
```typescript
if (!process.stdout.isTTY && !options.host) {
  console.error('agent-get error: Non-interactive environment detected. Please specify a host with --host <host>.');
  process.exit(2);
}
```

**Alternatives considered**: 自动选择第一个探测到的宿主（危险，可能意外安装到错误宿主）；安装到所有探测到的宿主（超出用户预期）。

---

## 13. Skill 来源校验

**Decision**: 写入前验证 resolved 目录含 `SKILL.md`，不含则 exit 2

**Rationale**: 与 Edge Cases "source 内容与声明类型不匹配：安装前校验"一致。提前验证避免写入不完整的 Skill 目录，比写入后宿主报错更容易排查。所有资产类型均在安装前完成校验，不在写到一半时报错。

---

## 14. 宿主探测逻辑

**Decision**: 按优先级扫描当前工作目录（CWD）及其父目录中的特征路径

**探测规则**:

| 宿主 | 特征路径（相对 CWD/父目录） | 全局特征路径 |
|------|--------------------------|------------|
| `cursor` | `.cursor/` | — |
| `claude-code` | `.claude/` | — |
| `claude-desktop` | — | `~/Library/Application Support/Claude/`（macOS）`%APPDATA%\Claude\`（Windows） |

**行为**: 探测到的宿主置顶；用户可从完整宿主列表中选择其他宿主。`--host` 直接指定时跳过探测。

---

## 13. 测试策略

**Decision**: `vitest` + 分层测试（unit / integration / contract）

| 层 | 内容 | 工具 |
|----|------|------|
| Unit | Manifest 解析、source URI 检测、marker 块读写、JSON merge 逻辑 | vitest |
| Integration | 对真实目录结构的安装流程（fixture 项目 + 临时目录） | vitest + tmp dir fixtures |
| Contract | CLI `--help` 输出与 spec 快照一致性检查 | vitest snapshot |

**Alternatives considered**: `jest`（配置更繁琐，vitest 与 TypeScript/ESM 兼容更好）。
