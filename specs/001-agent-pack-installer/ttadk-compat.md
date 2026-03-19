# TTADK Plugin ↔ Agent Pack 字段映射关系

**Branch**: `001-agent-pack-installer` | **Date**: 2026-03-17
**目标读者**：需要将现有 TTADK 插件迁移或兼容到 Agent Pack 格式的工程师

---

## 背景

TTADK（TypeScript Toolkit for AI Development Kit）使用 Plugin 规范描述可安装的 AI 能力单元。Agent Pack 是 `agent-get` 使用的跨宿主资产描述格式。本文档说明两者之间的字段映射关系，帮助团队判断迁移可行性。

---

## 字段映射总览

| 映射分类 | 含义 |
|---------|------|
| **直接继承** | 字段语义相同，可直接对应 |
| **需扩展** | 含义相近，但需要补充字段或调整格式 |
| **首版不支持** | agent-get v1 中尚未实现，需等后续版本 |

---

## 详细字段映射

### TTADK Plugin 顶层字段

| TTADK 字段 | Agent Pack 对应 | 映射分类 | 说明 |
|------------|----------------|---------|------|
| `name` | `Manifest.name`（格式：`namespace/pack-name`） | **需扩展** | TTADK 允许任意名称；Agent Pack 要求 `namespace/name` 格式（正则：`/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/`） |
| `version` | —（无对应字段） | **首版不支持** | Agent Pack v1 Manifest 不含版本字段；安装时始终取最新来源 |
| `description` | —（无对应字段） | **首版不支持** | 首版 Manifest 不含 description；可加入注释或文档 |
| `assets[]` | `Manifest.assets[]` | **直接继承** | 均为资产描述数组 |
| `dependencies[]` | —（无对应字段） | **首版不支持** | Agent Pack v1 不支持依赖声明；安装器不自动解析依赖 |

### TTADK AssetDescriptor 字段

| TTADK 字段 | Agent Pack 对应 | 映射分类 | 说明 |
|------------|----------------|---------|------|
| `type` | `AssetDescriptor.type` | **需扩展** | TTADK 支持更多类型（如 `reference`、`knowledge`、`script`）；Agent Pack v1 仅支持 `mcp`、`skill`、`prompt`、`command`、`subAgent`；不支持的类型在 Manifest 解析阶段报错 exit 2 |
| `source` | `AssetDescriptor.source` | **直接继承** | 均支持本地路径、Git URL；Agent Pack 额外支持直接 HTTP(S) 文件 URL |
| `name` | —（从 source 路径自动推断） | **需扩展** | TTADK 允许显式指定 name；Agent Pack v1 统一从 source 路径推断（去掉目录前缀和扩展名，或取 Git `#path` 最后一段） |
| `hosts[]` | —（由 `--host` CLI 参数决定） | **需扩展** | TTADK Plugin 可声明支持的宿主列表；Agent Pack 通过 `--host` 在安装时指定，安装器按宿主能力矩阵跳过不支持的类型 |
| `config{}` | —（嵌入 source 文件内） | **首版不支持** | TTADK 支持内联配置 object；Agent Pack 的宿主配置通过 Sub-agent frontmatter 的 `agent-get/<host>/<field>` 字段传递 |

---

## 资产类型映射

| TTADK 资产类型 | Agent Pack 资产类型 | 映射分类 |
|----------------|-------------------|---------|
| `mcp` | `mcp` | **直接继承** |
| `skill` | `skill` | **直接继承** |
| `prompt` | `prompt` | **直接继承** |
| `command` | `command` | **直接继承** |
| `sub-agent` / `agent` | `subAgent` | **需扩展**（字段名格式不同） |
| `reference` | — | **首版不支持** |
| `knowledge` | — | **首版不支持** |
| `script` | — | **首版不支持** |
| `template` | — | **首版不支持** |
| `resource` | — | **首版不支持** |

---

## 映射演练：`plugins/tns/fe-common/`

以 `plugins/tns/fe-common/` 插件为例，演示字段映射的实际操作。

假设该插件的 TTADK manifest 结构如下：

```json
{
  "name": "fe-common",
  "version": "2.1.0",
  "description": "前端通用开发能力包",
  "assets": [
    {
      "type": "mcp",
      "name": "playwright",
      "source": "./mcps/playwright.json",
      "hosts": ["cursor", "claude-code"]
    },
    {
      "type": "skill",
      "name": "fe-testing",
      "source": "./skills/fe-testing",
      "hosts": ["cursor", "claude-code"]
    },
    {
      "type": "prompt",
      "name": "code-style",
      "source": "./prompts/code-style.md"
    },
    {
      "type": "command",
      "name": "init-project",
      "source": "./commands/init-project.md"
    },
    {
      "type": "sub-agent",
      "name": "code-reviewer",
      "source": "./agents/code-reviewer.md"
    },
    {
      "type": "reference",
      "name": "design-system",
      "source": "./refs/design-system.md"
    }
  ]
}
```

### 迁移后的 Agent Pack Manifest

```json
{
  "name": "tns/fe-common",
  "assets": [
    {
      "type": "mcp",
      "source": "./mcps/playwright.json"
    },
    {
      "type": "skill",
      "source": "./skills/fe-testing"
    },
    {
      "type": "prompt",
      "source": "./prompts/code-style.md"
    },
    {
      "type": "command",
      "source": "./commands/init-project.md"
    },
    {
      "type": "subAgent",
      "source": "./agents/code-reviewer.md"
    }
  ]
}
```

### 逐字段迁移结论

| TTADK 字段 | 迁移操作 | 结论 |
|------------|---------|------|
| `name: "fe-common"` | 改为 `"tns/fe-common"`（加 namespace） | ✅ 可迁移，需手动添加 namespace |
| `version: "2.1.0"` | 删除 | ⚠️ 首版不支持，版本信息丢失 |
| `description: "..."` | 删除 | ⚠️ 首版不支持，改写注释或文档 |
| `assets[].name` | 删除（自动推断） | ✅ 可迁移，推断名称与原名一致（取文件名/目录名） |
| `assets[].hosts` | 删除（改为 CLI `--host`） | ✅ 可迁移，安装时指定宿主 |
| `assets[].type: "sub-agent"` | 改为 `"subAgent"` | ✅ 可迁移，字段名格式调整 |
| `assets[].type: "reference"` | 删除该资产条目 | ❌ 首版不支持，需等后续版本 |
| `assets[].config{}` | 迁移到 source 文件的 frontmatter 字段 | ⚠️ 需扩展，每个宿主配置项手动写入 `agent-get/<host>/<field>` |

---

## 迁移检查清单

- [ ] `name` 已改为 `namespace/pack-name` 格式
- [ ] 所有不支持的 `type` 值（`reference`、`knowledge`、`script`、`template`、`resource`）的资产已移除或标记为待后续版本
- [ ] 每个 `AssetDescriptor` 的 `name` 字段已删除（改为 source 路径自动推断）
- [ ] `hosts` 字段已删除（改为安装时 `--host` 指定）
- [ ] `version` 和 `description` 字段已删除
- [ ] Sub-agent 文件中的宿主特定配置已改写为 `agent-get/<host>/<field>` frontmatter 格式

---

## 已知限制（agent-get v1）

1. **无版本管理**：不跟踪已安装版本，重复安装通过幂等性检测（内容相同则 `exists`，内容不同则 `conflict`）
2. **无依赖解析**：Pack 之间的依赖需手动安装
3. **无 list/remove/update 命令**：首版仅支持安装；卸载需手动删除文件
4. **无 Registry 来源**：仅支持本地路径、Git URL、直接 HTTP(S) 文件
5. **reference/knowledge/script 类型不支持**：遇到则报错，不自动跳过
