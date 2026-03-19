# Data Model: agent-get CLI

**Branch**: `001-agent-pack-installer` | **Date**: 2026-03-17

---

## Entities

### 1. `Manifest`

Pack 的声明式元数据，从 `--pack` 来源解析得到。

```typescript
interface Manifest {
  name: string;           // "namespace/pack-name"，全局唯一标识
  assets: AssetDescriptor[];
}
```

**Validation rules**:
- `name`: 必须匹配 `/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/`
- `assets`: 非空数组
- 若任何 `asset.type` 不在支持列表中 → 解析阶段 `ZodError`，不进行写入

---

### 2. `AssetDescriptor`

Manifest 中单个资产的声明，也是 CLI flag 解析后的统一形式。**不含 `name` 字段**，资产名称从 source 路径自动推断。

```typescript
type AssetType = 'mcp' | 'skill' | 'prompt' | 'command' | 'subAgent';

interface AssetDescriptor {
  type: AssetType;
  source: string | string[];  // 单值或多值；多值时每项独立安装
}
```

**Validation rules**:
- `type`: 枚举值，不在 `['mcp', 'skill', 'prompt', 'command', 'subAgent']` 中则报错
- `source`: 非空字符串或非空字符串数组；每个 source 值须通过 `SourceResolver.validate()`

---

### 3. `CliInput`

从 Commander 解析得到的原始 CLI 输入，在进入安装流程前规范化为 `AssetDescriptor[]`。

```typescript
interface CliInput {
  mcp: string[];          // 来自 --mcp（可重复）
  skill: string[];        // 来自 --skill（可重复）
  prompt: string[];       // 来自 --prompt（可重复）
  command: string[];      // 来自 --command（可重复）
  subAgent: string[];     // 来自 --sub-agent（可重复）
  pack: string[];         // 来自 --pack（可重复）
  host?: string;          // 来自 --host（可选）
}
```

**规范化规则**: 将 `pack` 解析为 `Manifest` 后展开其 `assets`；其他 flag 直接映射为 `AssetDescriptor`。

**Name 推断规则**（安装器内部，不暴露给用户）：

| 来源示例 | 推断名称 | 规则 |
|---------|---------|------|
| `./mcps/playwright.json` | `playwright` | 去掉目录前缀和扩展名 |
| `git@github.com:demo/skills.git#e2e-guide` | `e2e-guide` | `#path` 最后一段路径 |
| `git@github.com:demo/skills.git#path/to/skill` | `skill` | `#path` 最后一段 |
| `./prompts/dev-practices.md` | `dev-practices` | 去掉目录和 `.md` |
| `./commands/init.md` | `init` | 去掉目录和 `.md` |
| `./agents/code-reviewer.md` | `code-reviewer` | 去掉目录和 `.md` |
| `git@github.com:org/repo.git`（无 `#path`） | `repo`（去掉 `.git`） | 仓库名 |

---

### 4. `ResolvedSource`

从 source 字符串解析得到的已下载/已定位的本地路径。

```typescript
type SourceType = 'local' | 'git-ssh' | 'git-https' | 'http-file';

interface ResolvedSource {
  type: SourceType;
  localPath: string;      // 所有来源解析后均为本地路径
  originalSource: string; // 原始 source 字符串，用于日志
  tempDir?: string;       // Git 或 HTTP 来源时的临时目录，安装后清理
}
```

**URI 检测规则**:
- 以 `git@` 开头 → `git-ssh`
- 以 `https://` 或 `http://` 开头，且含 `.git` 或含 `#path` → `git-https`
- 以 `https://` 或 `http://` 开头，且不含 `.git` 且不含 `#path` → `http-file`（直接下载单个文件）
- 其他 → `local`

**`http-file` 解析**:
- 直接 HTTP GET 下载文件内容到临时文件，`localPath = tmpdir/<inferred-name>.<ext>`
- 适用于单文件资产（MCP JSON、Prompt/Command/SubAgent `.md`）
- **禁止与 `skill` 类型组合**：Skill 需要目录结构（含 `SKILL.md`），安装器在写入前校验阶段将 `http-file × skill` 组合视为 exit 2 错误

**Git `#path` 解析**:
- `git@github.com:org/repo.git#path/to/asset` → repoUrl = `git@github.com:org/repo.git`, subPath = `path/to/asset`
- sparse checkout 后 `localPath = tmpdir/path/to/asset`

---

### 5. `HostConfig`

从 `src/hosts.json` 加载的静态宿主配置。运行时只读，不修改。

```typescript
interface HostConfig {
  id: string;             // 宿主唯一标识，如 'cursor'
  displayName: string;    // 展示名，如 'Cursor'
  docs: string;           // 文档 URL
  detection: HostDetection;
  assets: Record<AssetType, AssetCapability>;
}

interface HostDetection {
  paths: string[] | Record<string, string>;  // 数组=相对路径；对象=平台→路径
}

interface AssetCapability {
  supported: boolean;
  reason?: string;        // 不支持时的说明
  // 以下字段在 supported=true 时使用：
  configFile?: string | Record<string, string>;  // MCP 用
  configKey?: string;
  installDir?: string;    // Skill/Command/SubAgent 用
  entryFile?: string;     // Skill 用
  fileExtension?: string;
  pattern?: string;       // 安装路径模板，<name> 为占位符
  targetFile?: string;    // Prompt 用
  writeStrategy?: 'append-with-marker' | 'inject-json-key' | 'copy-file';
  markerFormat?: string;  // Prompt 用
}
```

---

### 6. `InstallJob`

一个待执行的安装单元（一个资产 × 一个宿主）。

```typescript
interface InstallJob {
  assetType: AssetType;
  assetName: string;
  resolvedSource: ResolvedSource;
  host: HostConfig;
}
```

**写入前校验规则**（在来源解析完成后、任何写入操作发生前执行，顺序依次检查）：

| 检查顺序 | 资产类型 | 校验规则 | 失败行为 |
|----------|----------|----------|----------|
| 1 | `skill` | `resolvedSource.type` 不得为 `http-file`：Skill 必须指向目录（本地路径或 Git URL），HTTP(S) 直链无法下载目录结构 | exit 2："Skill 资产必须指向目录来源，不支持直接 HTTP(S) URL" |
| 2 | `skill` | `resolvedSource.localPath` 目录内必须存在 `SKILL.md` 文件 | exit 2，错误消息说明期望的目录结构 |
| 3 | `mcp` | 解析后本地文件必须存在，扩展名为 `.json` | exit 2 |
| 4 | `prompt` / `command` / `subAgent` | 解析后本地文件必须存在，扩展名为 `.md` | exit 2 |

---

### 7. `InstallResult`

一个 `InstallJob` 的执行结果。

```typescript
type InstallStatus = 'written' | 'exists' | 'updated' | 'skipped' | 'conflict' | 'error';

interface InstallResult {
  job: InstallJob;
  status: InstallStatus;
  targetPath?: string;    // 成功写入时的目标路径
  reason?: string;        // skipped/conflict/error 时的说明
}
```

**Status 语义**:

| Status | 含义 |
|--------|------|
| `written` | 首次写入成功 |
| `exists` | 目标与来源完全相同，无需变更 |
| `updated` | 目标已存在且内容有差异，已更新（仅 prompt 更新 marker 块内容时使用） |
| `conflict` | 目标已存在且用户有手动修改，不覆盖 |
| `skipped` | 宿主不支持该资产类型 |
| `error` | 写入过程中发生错误 |

---

### 8. `InstallSummary`

单次命令执行的完整输出摘要。

```typescript
interface InstallSummary {
  host: HostConfig;
  results: InstallResult[];
  // 派生统计（渲染时计算）：
  // written: results.filter(r => r.status === 'written').length
  // skipped: results.filter(r => r.status === 'skipped').length
  // conflict: results.filter(r => r.status === 'conflict').length
}
```

---

## Entity 关系图

```
CliInput ──parse──► AssetDescriptor[] ──► InstallJob[]
                                               │
              Manifest ──expand──►             │
                                               │
                          HostConfig ──────────┘
                              │
                              ▼
                         InstallResult[]
                              │
                              ▼
                         InstallSummary (stdout)
```

---

## State Transitions（资产安装状态机）

```
[Start]
   │
   ├─ host.assets[type].supported === false ──► SKIPPED
   │
   ├─ source resolve fails ──► ERROR
   │
   ├─ target does not exist ──► write ──► WRITTEN
   │
   └─ target exists
         │
         ├─ content identical ──► EXISTS
         ├─ content differs (user-modified) ──► CONFLICT
         └─ content differs (can update, e.g. prompt marker) ──► UPDATED
```

---

## Zod Schema（Manifest 验证）

```typescript
import { z } from 'zod';

const AssetTypeEnum = z.enum(['mcp', 'skill', 'prompt', 'command', 'subAgent']);

const AssetDescriptorSchema = z.object({
  type: AssetTypeEnum,
  source: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
});

const ManifestSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/),
  assets: z.array(AssetDescriptorSchema).min(1),
});

export type Manifest = z.infer<typeof ManifestSchema>;
export type AssetDescriptor = z.infer<typeof AssetDescriptorSchema>;
```
