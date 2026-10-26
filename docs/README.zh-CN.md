<div align="center">

# agent-add

**一条命令，将 MCP、Skill、斜杆命令、子代理等安装到任意 AI 工具，如 Claude Code、Cursor 等**

[![npm](https://img.shields.io/npm/v/agent-add)](https://www.npmjs.com/package/agent-add)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](LICENSE)
[![Scenario Tests](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/pea3nut/agent-add/master/tests/test-results/badge.json)](tests/test-results/)

[English](../README.md) | **中文** | [日本語](./README.ja.md)

</div>

---

```bash
npx -y agent-add \
  --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}' \
  --mcp 'https://github.com/modelcontextprotocol/servers.git#.mcp.json' \
  --skill 'https://github.com/anthropics/skills.git#skills/pdf' \
  --prompt $'# Code Review Rules\n\nAlways review for security issues first.' \
  --command 'https://github.com/wshobson/commands.git#tools/security-scan.md' \
  --sub-agent 'https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/01-core-development/backend-developer.md'
```

---

| AI 工具 | MCP | Prompt | Skill | 斜杠命令 | 子代理 |
|------|-----|--------|-------|---------|-----------|
| <img src="https://www.google.com/s2/favicons?domain=cursor.com&sz=32" width="16"> Cursor | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=claude.ai&sz=32" width="16"> Claude Code | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=trae.ai&sz=32" width="16"> Trae | ✅ | ✅ | ✅ | ❌ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=qwen.ai&sz=32" width="16"> Qwen Code | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=github.com&sz=32" width="16"> GitHub Copilot | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=openai.com&sz=32" width="16"> Codex CLI | ✅ | ✅ | ✅ | ❌ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=windsurf.com&sz=32" width="16"> Windsurf | ✅ | ✅ | ✅ | ✅ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=gemini.google.com&sz=32" width="16"> Gemini CLI | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=kimi.ai&sz=32" width="16"> Kimi Code | ✅ | ✅ | ✅ | ❌ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=augmentcode.com&sz=32" width="16"> Augment | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=roocode.com&sz=32" width="16"> Roo Code | ✅ | ✅ | ✅ | ✅ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=kiro.dev&sz=32" width="16"> Kiro CLI | ✅ | ✅ | ✅ | ❌ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=tabnine.com&sz=32" width="16"> Tabnine CLI | ✅ | ✅ | ❌ | ✅ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=kilo.ai&sz=32" width="16"> Kilo Code | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=opencode.ai&sz=32" width="16"> opencode | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=openclawlab.com&sz=32" width="16"> OpenClaw | ❌ | ✅ | ✅ | ❌ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=mistral.ai&sz=32" width="16"> Mistral Vibe | ✅ | ✅ | ✅ | ❌ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=claude.ai&sz=32" width="16"> Claude Desktop | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 为什么需要 agent-add？

各个 AI 工具配置不尽相同，agent-add 可以帮您抹平它们的不同之处，用一条命令就能安装到所有 AI 工具中的任意一个：

```bash
npx -y agent-add --host claude-code --mcp 'https://github.com/modelcontextprotocol/servers.git#.mcp.json'
npx -y agent-add --host cursor      --mcp 'https://github.com/modelcontextprotocol/servers.git#.mcp.json'
npx -y agent-add --host codex       --mcp 'https://github.com/modelcontextprotocol/servers.git#.mcp.json'

# 不指定 AI 工具将会有个可交互的菜单供选择
npx -y agent-add --mcp 'https://github.com/modelcontextprotocol/servers.git#.mcp.json'
```

## 用法

安装 [Node.js](https://nodejs.org/)（v18+）后即可通过 `npx` 直接运行，无需额外安装。

### 安装 MCP

```bash
# 从 JSON 源码安装
npx -y agent-add \
  --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}'

# 从 Git 仓库中的配置文件安装
npx -y agent-add \
  --mcp 'https://github.com/modelcontextprotocol/servers.git#.mcp.json'

# 从 HTTP URL 直接安装
npx -y agent-add \
  --mcp 'https://raw.githubusercontent.com/modelcontextprotocol/servers/main/.mcp.json'
```

### 安装 Skill

```bash
# 从 Anthropic 官方 Skills 仓库安装
npx -y agent-add \
  --skill 'https://github.com/anthropics/skills.git#skills/pdf'

npx -y agent-add \
  --skill 'https://github.com/anthropics/skills.git#skills/webapp-testing'
```

### 安装 Prompt（Rule 文件 / System Prompt）

```bash
# 直接传入 Markdown 内联文本（含换行自动识别，第一个 # 标题作为名称）
npx -y agent-add --host claude-code \
  --prompt $'# Code Review Rules\n\nAlways review for security issues first.'

# 从知名 Cursor Rules 仓库安装
npx -y agent-add --host cursor \
  --prompt 'https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/nextjs-react-tailwind/.cursorrules'

# 从 HTTP URL 安装团队共享的 Prompt
npx -y agent-add --host claude-code \
  --prompt 'https://your-team.com/shared/code-review-rules.md'
```

### 安装斜杠命令（Command）

```bash
# 从 commands 仓库安装
npx -y agent-add --host cursor \
  --command 'https://github.com/wshobson/commands.git#tools/security-scan.md'

npx -y agent-add --host claude-code \
  --command 'https://github.com/wshobson/commands.git#tools/ai-assistant.md'
```

### 安装子代理（Sub-agent）

```bash
# 从社区 Sub-agent 仓库安装后端开发代理（⭐16k）
npx -y agent-add --host cursor \
  --sub-agent 'https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/01-core-development/backend-developer.md'

# 安装完整的三件套：后端 + Python + 代码审查
npx -y agent-add --host cursor \
  --sub-agent 'https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/01-core-development/backend-developer.md' \
  --sub-agent 'https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/02-language-specialists/python-pro.md' \
  --sub-agent 'https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/04-quality-security/code-reviewer.md'
```

## 来源格式

| 来源 | 示例 | MCP | Prompt | Skill | Command | Sub-agent |
|------|------|-----|--------|-------|---------|-----------|
| 内联 JSON | `'{"name":{...}}'`（以 `{` 开头） | ✅ | ❌ | ❌ | ❌ | ❌ |
| 内联 Markdown | `$'# Title\n\nContent'`（含换行） | ❌ | ✅ | ❌ | ✅ | ✅ |
| 本地路径 | `./mcps/config.json` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Git SSH | `git@github.com:org/repo.git@main#path` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Git HTTPS | `https://github.com/org/repo.git@v1.0#path` | ✅ | ✅ | ✅ | ✅ | ✅ |
| HTTP URL | `https://example.com/config.json` | ✅ | ✅ | ❌ | ✅ | ✅ |

> Git 来源支持 `@ref` 指定分支/标签/commit，`#path` 指定仓库内子路径（sparse checkout，不会克隆整个仓库）。

> 内联 JSON 格式为 `{"<名称>": {...config...}}`，key 即资产名称。内联 Markdown 从第一个 `# 标题` 推断名称。

> Skill 是目录资产，不支持内联内容或单文件 HTTP URL。

## CLI 参考

```
npx -y agent-add [OPTIONS]

Options:
  --host <host>         指定目标 AI Agent
  --mcp <source>        安装 MCP Server 配置
  --skill <source>      安装 Skill 目录
  --prompt <source>     安装 Prompt 文件
  --command <source>    安装 Command 文件
  --sub-agent <source>  安装 Sub-agent 文件
  --pack <source>       安装 Agent Pack manifest
  --overwrite          覆盖冲突资产（最后声明的来源优先）
  --dry-run            预览安装结果，不写入安装目标
  -V, --version         显示版本号
  -h, --help            显示帮助信息
```

所有资产 flag 可重复使用（安装多个同类资产），也可与 `--pack` 自由组合。

### 冲突与覆盖

默认保护已有内容：本次输入或已有安装中，不同内容指向同一个最终目标时报告冲突。所有受支持资产先完成准备和预检；预检失败时，**所有目标均不写入**。相同输入合并为一次安装；已安装内容相同时返回 `exists`，不重写。

可覆盖的冲突会提示重新运行原命令并追加 `--overwrite`：

```bash
agent-add --pack ./manifest.json --host claude-code --overwrite
```

安装前可使用 `--dry-run` 预览；和 `--overwrite` 一起使用时，可检查最终会选择哪个来源，但仍不写入安装目标：

```bash
agent-add --pack ./manifest.json --host claude-code --dry-run --overwrite
```

预览仍会解析、下载（如有需要）、校验来源并读取目标，输出 `would-write` / `would-update` / `would-skip` / `would-conflict`，不创建安装目录、暂存文件或更改目标内容。临时下载文件会清理。冲突或安装错误返回退出码 1，输入／用法错误返回 2。预览不是锁定或事务：之后正式执行会重新检查目标，其间目标可能变化。

- **最后声明者优先**：按 CLI 参数顺序，pack 在出现位置展开；manifest 的资产及 source 数组保持声明顺序，`/*` 子项按相对路径排序，不依赖下载速度。
- **只覆盖命中的资产**：MCP 仅替换同名 server；追加型 prompt 仅替换对应 marker，保留用户正文和其他 prompt。command、sub-agent、独立文件型 prompt 仅替换目标文件。追加型 prompt 内容变化也需要 `--overwrite`，不再默认更新。
- **Skill 完整替换，不合并**：新来源没有的旧文件会删除，包括用户添加的文件；比较隐藏文件，不影响其他 skill。缺少 `SKILL.md` 的不完整目录仍默认自动恢复，沿用原先合并来源文件的行为。
- **不绕过校验**：损坏配置、无效来源、权限、符号链接及结构性目标重叠仍报错。写入前再次检查目标，skill 先暂存再切换目录。没有跨进程锁，也不提供整批回滚；执行中出现新的 I/O 错误时，先前成功的写入会保留。

## 资产开发者指南

如果你是 MCP Server、Skill、Prompt 等资产的**开发者或分发者**，以下是 agent-add 接受的文件格式规范。

### MCP 配置文件

agent-add 支持两种 JSON 格式，自动识别：

**格式 A：内层配置（单个 server）**

```json
{
  "command": "npx",
  "args": ["@playwright/mcp@latest"],
  "env": {}
}
```

资产名从文件名推断：`playwright.json` → 名称为 `playwright`。

**格式 B：包含 `mcpServers` 的完整配置**

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

agent-add 会自动解包 `mcpServers`，提取内层的 server 名称和配置。

> 包裹格式目前仅支持单个 server。如需安装多个 MCP，请使用多个 `--mcp` flag 或 Pack 的多源语法。

**内联 JSON** 同样支持两种格式：

```bash
# 格式 A：顶层 key 即名称
npx -y agent-add --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}'

# 格式 B：自动解包 mcpServers
npx -y agent-add --mcp '{"mcpServers":{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}}'
```

agent-add 会自动将配置合并到目标宿主的配置文件中（如 `.cursor/mcp.json` 的 `mcpServers` 字段、Codex 的 TOML 等），开发者无需关心宿主差异。

### Skill 目录

Skill 是一个**目录**，根目录必须包含 `SKILL.md` 入口文件：

```
my-skill/
├── SKILL.md          ← 必须存在
├── helpers/
│   └── utils.py
└── templates/
    └── report.md
```

```markdown
<!-- SKILL.md -->
---
name: my-skill
description: A reusable agent skill.
---

# Skill: my-skill

This skill does something useful.
```

安装时整个目录会被递归复制到宿主的 skills 目录下（如 `.cursor/skills/my-skill/`）。

### Prompt 文件（Rule 文件 / System Prompt）

纯 Markdown 文件，无特殊格式要求：

```markdown
# Code Review Rules

Always review for security issues first.
Use bullet points for lists.
```

agent-add 根据宿主自动选择写入策略：

- **追加模式**（Cursor → `AGENTS.md`、Claude Code → `CLAUDE.md` 等）：内容被 HTML 注释 marker 包裹后追加到文件末尾，保证幂等：
  ```html
  <!-- agent-add:code-review-rules -->
  # Code Review Rules
  ...
  <!-- /agent-add:code-review-rules -->
  ```
- **独立文件模式**（Windsurf → `.windsurf/rules/`、Roo Code → `.roo/rules/` 等）：在规则目录下创建 `<name>.md` 文件

### Command 文件

Markdown 文件，支持可选的 YAML frontmatter：

```markdown
---
description: Run a comprehensive code review.
---

# code-review

Review the current file for bugs, security issues, and style violations.
```

安装到宿主的 commands 目录（如 `.cursor/commands/code-review.md`）。

对于 Gemini CLI，Markdown 正文会序列化为 `.gemini/commands/<name>.toml` 中的
`prompt` 字符串。可选的 frontmatter `description` 字符串会保留，其余 frontmatter
字段会省略。其他宿主仍保留原始 Markdown。

### Sub-agent 文件

Markdown + YAML frontmatter。支持 **`agent-add/<host>/<key>` 宿主特化语法** —— 同一份文件可为不同宿主提供不同的 frontmatter 字段值。这在指定 sub-agent 的模型时格外有用

比如我们希望这个 sub-agent 在 Cursor 和 Claude Code 都使用各自最快速的模型：

```markdown
---
name: playwright-tester
description: A playwright testing agent.
agent-get/cursor/model: fast
agent-get/claude-code/model: haiku
---

# Playwright Test Agent

Plan and generate Playwright tests.
```

安装时，agent-add 会：
1. 将匹配当前宿主的 `agent-add/<host>/*` 值**提升到顶层**
2. **移除**所有 `agent-add/*` 前缀的 key

**安装到 Cursor 后：**

```markdown
---
name: playwright-tester
description: A playwright testing agent.
model: fast
---

# Playwright Test Agent

Plan and generate Playwright tests.
```

**安装到 Claude Code 后：**

```markdown
---
name: playwright-tester
description: A playwright testing agent.
model: haiku
---

# Playwright Test Agent

Plan and generate Playwright tests.
```

### Pack Manifest

JSON 文件，将多种资产打包在一起分发：

```json
{
  "name": "my-team/frontend-pack",
  "assets": [
    { "type": "mcp",      "source": "https://github.com/modelcontextprotocol/servers.git#.mcp.json" },
    { "type": "skill",    "source": "https://github.com/anthropics/skills.git#skills/pdf" },
    { "type": "prompt",   "source": "https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/nextjs-react-tailwind/.cursorrules" },
    { "type": "command",  "source": "https://github.com/wshobson/commands.git#tools/security-scan.md" },
    { "type": "subAgent", "source": "https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/01-core-development/backend-developer.md" }
  ]
}
```

**字段规范：**

| 字段 | 要求 | 说明 |
|------|------|------|
| `name` | 必填 | 格式 `namespace/pack-name`，仅允许 `[a-zA-Z0-9_-]` |
| `assets` | 必填 | 至少 1 项 |
| `assets[].type` | 必填 | `mcp` \| `skill` \| `prompt` \| `command` \| `subAgent` |
| `assets[].source` | 必填 | 字符串或字符串数组（多源自动展开为多个同类资产） |

**多源示例** —— 一次安装多个 MCP：

```json
{
  "name": "my-team/mcp-collection",
  "assets": [
    {
      "type": "mcp",
      "source": [
        "https://github.com/modelcontextprotocol/servers.git#.mcp.json",
        "https://raw.githubusercontent.com/my-team/mcps/main/filesystem.json"
      ]
    }
  ]
}
```

### 资产名称推断

当未显式指定名称时，agent-add 按以下优先级从来源字符串推断：

| 来源类型 | 推断规则 | 示例 |
|----------|----------|------|
| 内联 JSON | 取唯一的顶层 key | `{"playwright":{...}}` → `playwright` |
| 内联 Markdown | 取第一个 `# 标题`，转 kebab-case | `# Code Review` → `code-review` |
| Git URL + `#path` | 取 `#` 后路径的最后一段（去扩展名） | `...git#skills/pdf` → `pdf` |
| Git URL 无 `#` | 取仓库名（去 `.git` 后缀） | `...playwright.git` → `playwright` |
| 本地路径 / HTTP | 取文件名（去扩展名） | `./mcps/playwright.json` → `playwright` |

## 贡献

欢迎贡献！以下是入门指南。

### 环境搭建

```bash
npm install
npm run build
npm run install:vibe
```

最后一条命令通过 `vibe/manifest.json` 包清单安装开发所需资产，包括 [scenario-test](https://github.com/pea3nut/scenario-test)（skill + command + sub-agent）、verify-host-readme 命令和系统提示词。当前宿主不支持的资产会被自动跳过。

### 运行测试

```bash
npm test                # 所有 unit + integration 测试
npm run test:contract   # 仅 CLI 黑盒契约测试
npx vitest run tests/unit/hosts/cursor.test.ts  # 单个文件
```

场景测试（`tests/features/` 中的 Gherkin `.feature` 文件）通过 AI agent 执行，需要预先安装 [scenario-test](https://github.com/pea3nut/scenario-test)。在 AI 工具中使用 `/scenario-exec` 命令触发：

```
/scenario-exec tests/features/core
/scenario-exec tests/features/host
```

每个场景在独立的临时目录中运行。运行配置定义在 `tests/features/scenario-run-config.md`（executor、并发数、tag 过滤等）。运行前请确保已执行 `npm run build`，因为场景测试调用编译后的 `bin/agent-add.js`。

## License

[Mozilla Public License 2.0](LICENSE)
