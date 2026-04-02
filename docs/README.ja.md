<div align="center">

# agent-add

**MCP、Skill、スラッシュコマンド、サブエージェントなどを Claude Code や Cursor などの AI ツールにワンコマンドでインストール**

[![npm](https://img.shields.io/npm/v/agent-add)](https://www.npmjs.com/package/agent-add)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](LICENSE)
[![Scenario Tests](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/pea3nut/agent-add/master/tests/test-results/badge.json)](tests/test-results/)

[English](../README.md) | [中文](./README.zh-CN.md) | **日本語**

</div>

---

```bash
npx -y agent-add \
  # MCP をインストール
  --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}'
  --mcp git@github.com:modelcontextprotocol/servers.git#.mcp.json \

  # Skill をインストール
  --skill https://github.com/anthropics/skills.git#skills/pdf \

  # System Prompt / ベースルールを追加
  --prompt $'# Code Review Rules\n\nAlways review for security issues first.'

  # スラッシュコマンドを追加
  --command https://github.com/wshobson/commands.git#tools/security-scan.md

  # サブエージェントをインストール
  --sub-agent https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/01-core-development/backend-developer.md
```

---

| AI ツール | MCP | Prompt | Skill | コマンド | サブエージェント |
|------|-----|--------|-------|---------|-----------|
| <img src="https://www.google.com/s2/favicons?domain=cursor.com&sz=32" width="16"> Cursor | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=claude.ai&sz=32" width="16"> Claude Code | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=github.com&sz=32" width="16"> GitHub Copilot | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=gemini.google.com&sz=32" width="16"> Gemini CLI | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=windsurf.com&sz=32" width="16"> Windsurf | ✅ | ✅ | ✅ | ✅ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=roocode.com&sz=32" width="16"> Roo Code | ✅ | ✅ | ✅ | ✅ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=openai.com&sz=32" width="16"> Codex CLI | ✅ | ✅ | ✅ | ❌ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=kilo.ai&sz=32" width="16"> Kilo Code | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=opencode.ai&sz=32" width="16"> opencode | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=augmentcode.com&sz=32" width="16"> Augment | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=qwen.ai&sz=32" width="16"> Qwen Code | ✅ | ✅ | ✅ | ✅ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=kiro.dev&sz=32" width="16"> Kiro CLI | ✅ | ✅ | ✅ | ❌ | ✅ |
| <img src="https://www.google.com/s2/favicons?domain=trae.ai&sz=32" width="16"> Trae | ✅ | ✅ | ✅ | ❌ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=tabnine.com&sz=32" width="16"> Tabnine CLI | ✅ | ✅ | ❌ | ✅ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=kimi.ai&sz=32" width="16"> Kimi Code | ✅ | ✅ | ✅ | ❌ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=openclawlab.com&sz=32" width="16"> OpenClaw | ✅ | ✅ | ✅ | ❌ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=mistral.ai&sz=32" width="16"> Mistral Vibe | ✅ | ✅ | ✅ | ❌ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=claude.ai&sz=32" width="16"> Claude Desktop | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## なぜ agent-add？

AI ツールはそれぞれ独自の設定形式を持っています — Cursor は `.cursor/mcp.json`、Claude Code は `.mcp.json`、Windsurf はグローバルパス、Codex は TOML……

agent-add はこれらの違いをすべて吸収します。ワンコマンドで任意の AI ツールにインストールできます：

```bash
npx -y agent-add --host claude-code --mcp https://github.com/modelcontextprotocol/servers.git#.mcp.json
npx -y agent-add --host cursor      --mcp https://github.com/modelcontextprotocol/servers.git#.mcp.json
npx -y agent-add --host codex       --mcp https://github.com/modelcontextprotocol/servers.git#.mcp.json

# --host を省略すると対話式の選択メニューが表示されます
npx -y agent-add --mcp https://github.com/modelcontextprotocol/servers.git#.mcp.json
```

## 使い方

### MCP のインストール

```bash
# インライン JSON からインストール
npx -y agent-add \
  --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}'

# Git リポジトリからインストール
npx -y agent-add \
  --mcp git@github.com:modelcontextprotocol/servers.git#.mcp.json

# HTTP URL からインストール
npx -y agent-add \
  --mcp https://raw.githubusercontent.com/modelcontextprotocol/servers/main/.mcp.json
```

### Skill のインストール

```bash
# Anthropic 公式 Skills リポジトリからインストール
npx -y agent-add \
  --skill https://github.com/anthropics/skills.git#skills/pdf

npx -y agent-add \
  --skill https://github.com/anthropics/skills.git#skills/webapp-testing
```

### Prompt のインストール（ルールファイル / System Prompt）

```bash
# インライン Markdown を直接渡す（改行で自動検出、最初の # 見出しが名前になります）
npx -y agent-add --host claude-code \
  --prompt $'# Code Review Rules\n\nAlways review for security issues first.'

# 有名な Cursor Rules リポジトリからインストール
npx -y agent-add --host cursor \
  --prompt https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/nextjs-react-tailwind/.cursorrules

# HTTP URL からチーム共有のプロンプトをインストール
npx -y agent-add --host claude-code \
  --prompt https://your-team.com/shared/code-review-rules.md
```

### スラッシュコマンドのインストール

```bash
# commands リポジトリからインストール
npx -y agent-add --host cursor \
  --command https://github.com/wshobson/commands.git#tools/security-scan.md

npx -y agent-add --host claude-code \
  --command https://github.com/wshobson/commands.git#tools/ai-assistant.md
```

### サブエージェントのインストール

```bash
# VoltAgent の awesome-claude-code-subagents リポジトリからバックエンド開発エージェントをインストール（⭐16k）
npx -y agent-add --host cursor \
  --sub-agent https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/01-core-development/backend-developer.md

# 3点セットをインストール：バックエンド + Python + コードレビュー
npx -y agent-add --host cursor \
  --sub-agent https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/01-core-development/backend-developer.md \
  --sub-agent https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/02-language-specialists/python-pro.md \
  --sub-agent https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/04-quality-security/code-reviewer.md
```

## ソース形式

| ソース | 例 | MCP | Prompt | Skill | Command | Sub-agent |
|--------|------|-----|--------|-------|---------|-----------|
| インライン JSON | `'{"name":{...}}'`（`{` で始まる） | ✅ | ❌ | ❌ | ❌ | ❌ |
| インライン Markdown | `$'# Title\n\nContent'`（改行を含む） | ❌ | ✅ | ❌ | ✅ | ✅ |
| ローカルパス | `./mcps/config.json` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Git SSH | `git@github.com:org/repo.git@main#path` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Git HTTPS | `https://github.com/org/repo.git@v1.0#path` | ✅ | ✅ | ✅ | ✅ | ✅ |
| HTTP URL | `https://example.com/config.json` | ✅ | ✅ | ❌ | ✅ | ✅ |

> Git ソースは `@ref` でブランチ/タグ/コミットを、`#path` でリポジトリ内のサブパスを指定できます（sparse checkout — リポジトリ全体をクローンしません）。

> インライン JSON の形式：`{"<名前>": {...config...}}`、キーがアセット名になります。インライン Markdown は最初の `# 見出し` から名前を推定します。

> Skill はディレクトリアセットのため、インラインコンテンツや単一ファイルの HTTP URL には対応していません。

## CLI リファレンス

```
npx -y agent-add [OPTIONS]

Options:
  --host <host>         対象の AI ツール ID
  --mcp <source>        MCP Server 設定をインストール
  --skill <source>      Skill ディレクトリをインストール
  --prompt <source>     Prompt ファイルをインストール
  --command <source>    Command ファイルをインストール
  --sub-agent <source>  Sub-agent ファイルをインストール
  --pack <source>       Agent Pack マニフェストをインストール
  -V, --version         バージョンを表示
  -h, --help            ヘルプを表示
```

すべてのアセットフラグは繰り返し使用でき（同じタイプのアセットを複数インストール）、`--pack` と自由に組み合わせられます。

## アセット開発者ガイド

MCP Server、Skill、Prompt などのアセットの**開発者またはディストリビューター**向けに、agent-add が受け付けるファイル形式の仕様を説明します。

### MCP 設定ファイル

agent-add は2種類の JSON 形式をサポートし、自動的に検出します：

**形式 A：内部設定（単一サーバー）**

```json
{
  "command": "npx",
  "args": ["@playwright/mcp@latest"],
  "env": {}
}
```

アセット名はファイル名から推定されます：`playwright.json` → 名前は `playwright`。

**形式 B：`mcpServers` ラッパー付きの完全な設定**

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

agent-add は自動的に `mcpServers` をアンラップし、内部のサーバー名と設定を抽出します。

> ラッパー形式は現在、単一サーバーのみ対応しています。複数の MCP をインストールするには、複数の `--mcp` フラグまたは Pack のマルチソース構文を使用してください。

**インライン JSON** も両方の形式をサポートしています：

```bash
# 形式 A：トップレベルキーが名前になる
npx -y agent-add --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}'

# 形式 B：mcpServers を自動アンラップ
npx -y agent-add --mcp '{"mcpServers":{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}}'
```

agent-add は設定を対象ホストの設定ファイル（`.cursor/mcp.json` の `mcpServers` フィールド、Codex の TOML など）に自動的にマージします。アセット開発者はホストの違いを気にする必要はありません。

### Skill ディレクトリ

Skill は**ディレクトリ**であり、ルートに `SKILL.md` エントリファイルが必須です：

```
my-skill/
├── SKILL.md          ← 必須
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

インストール時、ディレクトリ全体がホストの skills ディレクトリに再帰的にコピーされます（例：`.cursor/skills/my-skill/`）。

### Prompt ファイル（ルールファイル / System Prompt）

特別な形式要件のないプレーンな Markdown ファイルです：

```markdown
# Code Review Rules

Always review for security issues first.
Use bullet points for lists.
```

agent-add はホストに応じて書き込み戦略を自動選択します：

- **追記モード**（Cursor → `AGENTS.md`、Claude Code → `CLAUDE.md` など）：HTML コメントマーカーで囲んでファイル末尾に追記し、冪等性を保証：
  ```html
  <!-- agent-add:code-review-rules -->
  # Code Review Rules
  ...
  <!-- /agent-add:code-review-rules -->
  ```
- **独立ファイルモード**（Windsurf → `.windsurf/rules/`、Roo Code → `.roo/rules/` など）：ルールディレクトリに `<name>.md` ファイルを作成

### Command ファイル

オプションの YAML フロントマター付き Markdown ファイル：

```markdown
---
description: Run a comprehensive code review.
---

# code-review

Review the current file for bugs, security issues, and style violations.
```

ホストの commands ディレクトリにインストールされます（例：`.cursor/commands/code-review.md`）。

### Sub-agent ファイル

Markdown + YAML フロントマター。**`agent-add/<host>/<key>` ホスト特化構文**をサポートしています — 同一ファイルで異なるホストに異なるフロントマター値を提供できます。これはサブエージェントのモデルを指定する際に特に便利です。

例えば、各ホストで最速のモデルを使用したい場合：

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

インストール時、agent-add は以下を行います：
1. 現在のホストに一致する `agent-add/<host>/*` の値を**トップレベルに昇格**
2. すべての `agent-add/*` プレフィックス付きキーを**削除**

**Cursor にインストールした後：**

```markdown
---
name: playwright-tester
description: A playwright testing agent.
model: fast
---

# Playwright Test Agent

Plan and generate Playwright tests.
```

**Claude Code にインストールした後：**

```markdown
---
name: playwright-tester
description: A playwright testing agent.
model: haiku
---

# Playwright Test Agent

Plan and generate Playwright tests.
```

### Pack マニフェスト

複数のアセットをまとめて配布する JSON ファイル：

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

**フィールド仕様：**

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `name` | はい | `namespace/pack-name` 形式、`[a-zA-Z0-9_-]` のみ使用可 |
| `assets` | はい | 1項目以上 |
| `assets[].type` | はい | `mcp` \| `skill` \| `prompt` \| `command` \| `subAgent` |
| `assets[].source` | はい | 文字列または文字列の配列（マルチソースは同タイプの複数アセットに自動展開） |

**マルチソースの例** — 複数の MCP を一度にインストール：

```json
{
  "name": "my-team/mcp-collection",
  "assets": [
    {
      "type": "mcp",
      "source": [
        "git@github.com:modelcontextprotocol/servers.git#.mcp.json",
        "https://raw.githubusercontent.com/my-team/mcps/main/filesystem.json"
      ]
    }
  ]
}
```

### アセット名の推定

名前が明示的に指定されていない場合、agent-add は以下の優先順位でソース文字列から推定します：

| ソースタイプ | 推定ルール | 例 |
|-------------|-----------|------|
| インライン JSON | 唯一のトップレベルキーを取得 | `{"playwright":{...}}` → `playwright` |
| インライン Markdown | 最初の `# 見出し` を取得し、kebab-case に変換 | `# Code Review` → `code-review` |
| Git URL + `#path` | `#` 以降のパスの最後のセグメント（拡張子除去） | `...git#skills/pdf` → `pdf` |
| Git URL（`#` なし） | リポジトリ名（`.git` サフィックス除去） | `...playwright.git` → `playwright` |
| ローカルパス / HTTP | ファイル名（拡張子除去） | `./mcps/playwright.json` → `playwright` |

## コントリビュート

コントリビューション歓迎です！新しいホストの追加については [Host Capability Matrix](../src/hosts/README.md) を参照してください。

## License

[Mozilla Public License 2.0](LICENSE)
