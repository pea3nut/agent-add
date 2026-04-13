# PRD: 新增 `rule` 资产类型

**状态**: Draft
**日期**: 2026-04-10

---

## 背景

社区存在大量"规则集合"仓库，例如：
- [cursor-security-rules](https://github.com/matank001/cursor-security-rules)：根目录 16 个 `.mdc` 文件（Cursor 安全规则）
- [andrej-karpathy-skills-cursor-vscode](https://github.com/mbeijen/andrej-karpathy-skills-cursor-vscode)：`rules/` 子目录下的 `.md` 规则文件

这些仓库的规则文件带有 `globs`、`alwaysApply`、`description` 等条件匹配 frontmatter，属于宿主的**原生规则系统**，语义上不同于 `--prompt`（通用指令）。

当前 `--prompt` 在 Cursor 上写入 `AGENTS.md`（append-with-marker），无法将 `.mdc` 文件安装到 `.cursor/rules/`。多个宿主（Cursor、Windsurf、Trae、Roo Code、Kiro 等）都有独立的 rules 目录和条件匹配机制，但 agent-add 缺少对应的资产类型来覆盖这一概念。

### 调研：各宿主原生规则系统

| 宿主 | 规则目录 | 格式 | 条件匹配 |
|------|---------|------|----------|
| **Cursor** | `.cursor/rules/*.mdc` | MDC (MD + YAML frontmatter) | `globs`, `alwaysApply`, `description` |
| **Windsurf** | `.windsurf/rules/*.md` | MD + frontmatter | `globs`, `alwaysApply` |
| **Trae** | `.trae/rules/*.md` | MD + frontmatter | `globs`, `alwaysApply`, `description` |
| **Roo Code** | `.roo/rules/*.md` | 纯 MD | 按文件名排序全部加载 |
| **Kilo Code** | `.kilocode/rules/*.md` | MD | 通过 `kilo.jsonc` 引用 |
| **Kiro** | `.kiro/steering/*.md` | MD | 文件名自定义 |
| **Augment** | `.augment/rules/*.md` | MD | 支持 `AGENTS.md` 兼容 |
| **Tabnine** | `.tabnine/guidelines/*.md` | MD | — |
| **GitHub Copilot** | `.github/instructions/*.instructions.md` | MD + frontmatter | `applyTo` glob |
| **Claude Code** | 无规则目录 | — | 仅 `CLAUDE.md` |
| **其他** | 无规则目录 | — | 仅 `AGENTS.md` |

---

## 目标 UX

```bash
# 安装整个安全规则集合到 Cursor
npx -y agent-add --host cursor \
  --rule 'https://github.com/matank001/cursor-security-rules.git'
# → 16 个 .mdc 文件写入 .cursor/rules/

# 安装 karpathy 规则到 Cursor（指定子目录）
npx -y agent-add --host cursor \
  --rule 'https://github.com/mbeijen/andrej-karpathy-skills-cursor-vscode.git#rules'
# → rules/ 下的 .md 文件写入 .cursor/rules/（转为 .mdc）

# 同一仓库安装到 Windsurf
npx -y agent-add --host windsurf \
  --rule 'https://github.com/matank001/cursor-security-rules.git'
# → 16 个文件写入 .windsurf/rules/*.md

# 安装到 Claude Code（无 rules 目录，fallback 追加到 CLAUDE.md）
npx -y agent-add --host claude-code \
  --rule 'https://github.com/matank001/cursor-security-rules.git'
# → 16 个规则追加到 CLAUDE.md（各自用 marker 块）

# 单文件安装
npx -y agent-add --host cursor \
  --rule 'https://github.com/matank001/cursor-security-rules.git#secure-dev-python.mdc'

# pack manifest 中使用
{ "type": "rule", "source": "https://github.com/matank001/cursor-security-rules.git" }
```

---

## 设计方案

### 核心：新增 `rule` 资产类型

`rule` 是独立于 `prompt` 的第 6 种资产类型。它映射到各宿主的**原生规则目录**，而 `prompt` 保持映射到通用指令文件（AGENTS.md/CLAUDE.md）或 create-file-in-dir（已有行为不变）。

### rule vs prompt 的区别

| 维度 | `--prompt` | `--rule` |
|------|-----------|----------|
| 语义 | 通用指令，始终生效 | 宿主原生规则，可带条件匹配 |
| Cursor 安装位置 | `AGENTS.md` | `.cursor/rules/*.mdc` |
| Windsurf 安装位置 | `.windsurf/rules/*.md` | `.windsurf/rules/*.md`（相同） |
| 源格式 | 单个 .md 文件 | 单个 .md/.mdc 文件，或**整个目录** |
| 目录展开 | 不支持 | 支持（扫描 .md/.mdc 批量安装） |

### 特性 1：目录源展开

当 `--rule` 源解析后的 `localPath` 为目录时，自动扫描目录内 `.md`/`.mdc` 文件，展开为多个 InstallJob。

- **浅扫描**：只扫一级目录，不递归。嵌套结构通过 `#subPath` 定位
- **排除常见非规则文件**：`README.md`、`LICENSE.md`、`CHANGELOG.md`、`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`
- **空目录**：报错退出

### 特性 2：跨宿主扩展名适配

源文件可能是 `.mdc`（Cursor 格式）或 `.md`，安装时根据宿主的 `fileExtension` 配置决定输出扩展名：
- Cursor → `.mdc`
- Windsurf/Trae/Roo Code 等 → `.md`
- GitHub Copilot → `.instructions.md`

内容本身不做转换（.mdc 内容就是 Markdown + YAML frontmatter，各宿主都能处理）。

### 特性 3：无 rules 目录的宿主 fallback

Claude Code、Codex、Gemini 等无独立 rules 目录的宿主，rule 类型 fallback 到 `append-with-marker` 策略，追加到对应的指令文件（CLAUDE.md/AGENTS.md/GEMINI.md）。

Claude Desktop 完全不支持 rule（`supported: false`）。

---

## 改动清单

### 1. `src/hosts/types.ts` — AssetType 新增 `rule`

```typescript
export type AssetType = 'mcp' | 'skill' | 'prompt' | 'command' | 'subAgent' | 'rule';
```

### 2. `src/hosts/<id>.ts` — 18 个 adapter 新增 rule 能力

**create-file-in-dir 策略**（有原生 rules 目录）：

| 宿主 | installDir | fileExtension |
|------|-----------|---------------|
| cursor | `.cursor/rules` | `.mdc` |
| windsurf | `.windsurf/rules` | `.md` |
| trae | `.trae/rules` | `.md` |
| roo-code | `.roo/rules` | `.md` |
| kilo-code | `.kilocode/rules` | `.md` |
| kiro | `.kiro/steering` | `.md` |
| augment | `.augment/rules` | `.md` |
| tabnine | `.tabnine/guidelines` | `.md` |
| github-copilot | `.github/instructions` | `.instructions.md` |

**append-with-marker 策略**（无 rules 目录，fallback）：

| 宿主 | targetFile |
|------|-----------|
| claude-code | `CLAUDE.md` |
| codex | `AGENTS.md` |
| gemini | `GEMINI.md` |
| qwen-code | `AGENTS.md` |
| opencode | `AGENTS.md` |
| openclaw | `AGENTS.md` |
| kimi | `AGENTS.md` |
| vibe | `AGENTS.md` |

**不支持**：`claude-desktop`（`supported: false`，UI 应用无项目级文件）

### 3. `src/assets/rule.ts` — 新建 rule handler

逻辑与 `prompt.ts` 基本一致，支持两种 writeStrategy：
- **`create-file-in-dir`**：`installDir/<assetName><fileExtension>`，已存在则 `exists`
- **`append-with-marker`**：用 `<!-- agent-add:<name> -->` marker 追加到 targetFile

可直接从 `prompt.ts` 提取或复制。

### 4. `src/installer.ts` — 注册 handler + 校验 + 目录展开

#### 4a. 导入并注册（getHandler）
```typescript
import { ruleHandler } from './assets/rule.js';
case 'rule': return ruleHandler;
```

#### 4b. 校验逻辑（validateAsset）
rule 接受 `.md` 和 `.mdc` 两种扩展名，也接受目录（目录由展开步骤处理）：
```typescript
const RULE_EXTENSIONS = new Set(['.md', '.mdc']);
```

#### 4c. 目录展开（expandDirectorySource）
在源解析后、校验前插入。当 `assetType === 'rule'` 且 `localPath` 为目录时，扫描 `.md`/`.mdc` 文件展开为多个条目：
```typescript
const EXCLUDED_FILENAMES = new Set([
  'readme.md', 'changelog.md', 'contributing.md',
  'license.md', 'code_of_conduct.md',
]);
```
展开后每个条目的 `assetName` 从文件名推断（`path.basename(filename, ext)`）。

tempDir 清理用展开前的原始列表，避免重复清理。

#### 4d. CliInput 接口
```typescript
rule: string[];
```

#### 4e. explicitDescriptors 构建
```typescript
for (const source of cliInput.rule) {
  explicitDescriptors.push({ type: 'rule', source });
}
```

### 5. `src/cli.ts` — 新增 --rule flag

```typescript
.option('--rule <source>', 'Install a Rule (copies to host\'s native rules directory)', collect, [])
```

更新 hasAssetFlags 检查、CliInput 构造、help 文本。

### 6. `src/manifest/schema.ts` — AssetTypeEnum 加 rule

```typescript
const AssetTypeEnum = z.enum(['mcp', 'skill', 'prompt', 'command', 'subAgent', 'rule']);
```

### 7. `src/hosts/README.md` — 更新能力矩阵

矩阵表格新增 Rule 列，每个宿主详情新增 Rule 行。

### 8. 测试

| 文件 | 操作 | 内容 |
|------|------|------|
| `tests/unit/hosts/*.test.ts` (×18) | 编辑 | 新增 rule 能力断言 |
| `tests/unit/manifest/manifest-schema.test.ts` | 编辑 | 验证 `rule` 类型 |
| `tests/unit/assets/rule.test.ts` | **新建** | create-file-in-dir + append-with-marker 两种策略 |
| `tests/unit/installer/expand-directory.test.ts` | **新建** | 目录展开逻辑：正常展开、排除文件、空目录、非目录跳过 |

### 9. README.md + 翻译文档同步

在用法示例、资产类型表格中新增 `--rule`。同步 `docs/README.zh-CN.md` 和 `docs/README.ja.md`。

---

## 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 独立类型 vs 扩展 prompt | 独立 `rule` 类型 | 语义清晰；Cursor 的 prompt→AGENTS.md 和 rule→.cursor/rules/ 是完全不同的路径 |
| 无 rules 目录的宿主 | fallback 到 append-with-marker | 保证 `--rule` 跨宿主不报错，降低用户心智负担 |
| 目录展开范围 | 仅 rule 类型 | prompt/command/subAgent 暂无此需求，不过度设计 |
| 输出扩展名 | 由宿主 adapter 的 fileExtension 决定 | Cursor→.mdc, Windsurf→.md，适配各宿主原生格式 |
| 内容转换 | 不做 | .mdc 本质就是 Markdown + YAML frontmatter，各宿主都能处理 |
| 浅扫描 vs 递归 | 浅扫描 | 规则仓库通常扁平，嵌套场景用 #subPath |

---

## 文件改动汇总

| 文件 | 操作 | 改动量 |
|------|------|--------|
| `src/hosts/types.ts` | 编辑 | 1 行 |
| `src/hosts/*.ts` (×18) | 编辑 | 每个 ~5-8 行 |
| `src/assets/rule.ts` | **新建** | ~90 行 |
| `src/installer.ts` | 编辑 | ~50 行 |
| `src/cli.ts` | 编辑 | ~8 行 |
| `src/manifest/schema.ts` | 编辑 | 1 行 |
| `src/hosts/README.md` | 编辑 | 矩阵 + 18 个详情 |
| `tests/unit/hosts/*.test.ts` (×18) | 编辑 | 每个 ~10 行 |
| `tests/unit/manifest/manifest-schema.test.ts` | 编辑 | ~5 行 |
| `tests/unit/assets/rule.test.ts` | **新建** | ~120 行 |
| `tests/unit/installer/expand-directory.test.ts` | **新建** | ~80 行 |
| `README.md` + `docs/README.zh-CN.md` + `docs/README.ja.md` | 编辑 | 示例 + 表格 |

---

## 验证方案

1. `npm run lint` — 类型检查通过
2. `npm test` — 所有现有测试不回归 + 新测试通过
3. 手动本地测试：
   ```bash
   # 本地目录（含多个 .mdc 文件）
   npx -y agent-add --host cursor --rule ./test-rules/
   # 验证 .cursor/rules/ 下生成了对应 .mdc 文件

   # 本地目录安装到 Claude Code（fallback）
   npx -y agent-add --host claude-code --rule ./test-rules/
   # 验证 CLAUDE.md 中追加了 marker 块
   ```
4. Git 仓库测试（需网络）：
   ```bash
   npx -y agent-add --host cursor \
     --rule 'https://github.com/matank001/cursor-security-rules.git'
   ```
