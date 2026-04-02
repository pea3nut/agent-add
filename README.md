<div align="center">

# agent-add

**Install MCP, Skills, slash commands, sub-agents and more into any AI tool like Claude Code, Cursor, etc.**

[![npm](https://img.shields.io/npm/v/agent-add)](https://www.npmjs.com/package/agent-add)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](LICENSE)
[![Scenario Tests](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/pea3nut/agent-add/master/tests/test-results/badge.json)](tests/test-results/)

**English** | [中文](./docs/README.zh-CN.md) | [日本語](./docs/README.ja.md)

</div>

---

```bash
npx -y agent-add \
  # Install MCP
  --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}'
  --mcp git@github.com:modelcontextprotocol/servers.git#.mcp.json \

  # Install Skill
  --skill https://github.com/anthropics/skills.git#skills/pdf \

  # Add System Prompt / base Rule
  --prompt $'# Code Review Rules\n\nAlways review for security issues first.'

  # Add slash command
  --command https://github.com/wshobson/commands.git#tools/security-scan.md

  # Install sub-agent
  --sub-agent https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/01-core-development/backend-developer.md
```

---

| AI Tool | MCP | Prompt | Skill | Command | Sub-agent |
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
| <img src="https://www.google.com/s2/favicons?domain=openclawlab.com&sz=32" width="16"> OpenClaw | ✅ | ✅ | ✅ | ❌ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=mistral.ai&sz=32" width="16"> Mistral Vibe | ✅ | ✅ | ✅ | ❌ | ❌ |
| <img src="https://www.google.com/s2/favicons?domain=claude.ai&sz=32" width="16"> Claude Desktop | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Why agent-add?

Every AI tool has its own config format — Cursor uses `.cursor/mcp.json`, Claude Code uses `.mcp.json`, Windsurf uses global paths, Codex even uses TOML...

agent-add smooths out all the differences. One command installs to any of the supported AI tools:

```bash
npx -y agent-add --host claude-code --mcp https://github.com/modelcontextprotocol/servers.git#.mcp.json
npx -y agent-add --host cursor      --mcp https://github.com/modelcontextprotocol/servers.git#.mcp.json
npx -y agent-add --host codex       --mcp https://github.com/modelcontextprotocol/servers.git#.mcp.json

# Omit --host for an interactive selection menu
npx -y agent-add --mcp https://github.com/modelcontextprotocol/servers.git#.mcp.json
```

## Usage

### Install MCP

```bash
# From inline JSON
npx -y agent-add \
  --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}'

# From a Git repository
npx -y agent-add \
  --mcp git@github.com:modelcontextprotocol/servers.git#.mcp.json

# From an HTTP URL
npx -y agent-add \
  --mcp https://raw.githubusercontent.com/modelcontextprotocol/servers/main/.mcp.json
```

### Install Skill

```bash
# From the official Anthropic Skills repository
npx -y agent-add \
  --skill https://github.com/anthropics/skills.git#skills/pdf

npx -y agent-add \
  --skill https://github.com/anthropics/skills.git#skills/webapp-testing
```

### Install Prompt (Rule file / System Prompt)

```bash
# Pass inline Markdown directly (newlines trigger auto-detection, first # heading becomes the name)
npx -y agent-add --host claude-code \
  --prompt $'# Code Review Rules\n\nAlways review for security issues first.'

# From the popular Cursor Rules repository
npx -y agent-add --host cursor \
  --prompt https://raw.githubusercontent.com/PatrickJS/awesome-cursorrules/main/rules/nextjs-react-tailwind/.cursorrules

# From an HTTP URL for team-shared prompts
npx -y agent-add --host claude-code \
  --prompt https://your-team.com/shared/code-review-rules.md
```

### Install Slash Command

```bash
# From the commands repository
npx -y agent-add --host cursor \
  --command https://github.com/wshobson/commands.git#tools/security-scan.md

npx -y agent-add --host claude-code \
  --command https://github.com/wshobson/commands.git#tools/ai-assistant.md
```

### Install Sub-agent

```bash
# From VoltAgent's awesome-claude-code-subagents repository (⭐16k)
npx -y agent-add --host cursor \
  --sub-agent https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/01-core-development/backend-developer.md

# Install the full trio: backend + Python + code-reviewer
npx -y agent-add --host cursor \
  --sub-agent https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/01-core-development/backend-developer.md \
  --sub-agent https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/02-language-specialists/python-pro.md \
  --sub-agent https://github.com/VoltAgent/awesome-claude-code-subagents.git#categories/04-quality-security/code-reviewer.md
```

## Source Formats

| Source | Example | MCP | Prompt | Skill | Command | Sub-agent |
|--------|---------|-----|--------|-------|---------|-----------|
| Inline JSON | `'{"name":{...}}'` (starts with `{`) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Inline Markdown | `$'# Title\n\nContent'` (contains newline) | ❌ | ✅ | ❌ | ✅ | ✅ |
| Local path | `./mcps/config.json` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Git SSH | `git@github.com:org/repo.git@main#path` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Git HTTPS | `https://github.com/org/repo.git@v1.0#path` | ✅ | ✅ | ✅ | ✅ | ✅ |
| HTTP URL | `https://example.com/config.json` | ✅ | ✅ | ❌ | ✅ | ✅ |

> Git sources support `@ref` for branch/tag/commit and `#path` for sub-paths within the repo (sparse checkout — won't clone the entire repository).

> Inline JSON format: `{"<name>": {...config...}}`, the key is the asset name. Inline Markdown infers the name from the first `# heading`.

> Skill is a directory asset and does not support inline content or single-file HTTP URLs.

## CLI Reference

```
npx -y agent-add [OPTIONS]

Options:
  --host <host>         Target AI tool ID
  --mcp <source>        Install an MCP Server config
  --skill <source>      Install a Skill directory
  --prompt <source>     Install a Prompt file
  --command <source>    Install a Command file
  --sub-agent <source>  Install a Sub-agent file
  --pack <source>       Install an Agent Pack manifest
  -V, --version         Show version number
  -h, --help            Show help
```

All asset flags can be repeated (to install multiple assets of the same type) and freely combined with `--pack`.

## Asset Developer Guide

If you are a **developer or distributor** of MCP Servers, Skills, Prompts, or other assets, here are the file format specifications that agent-add accepts.

### MCP Config File

agent-add supports two JSON formats and auto-detects which one you're using:

**Format A: Inner config (single server)**

```json
{
  "command": "npx",
  "args": ["@playwright/mcp@latest"],
  "env": {}
}
```

The asset name is inferred from the filename: `playwright.json` → name is `playwright`.

**Format B: Full config with `mcpServers` wrapper**

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

agent-add automatically unwraps `mcpServers` and extracts the inner server name and config.

> The wrapped format currently supports a single server only. To install multiple MCPs, use multiple `--mcp` flags or Pack multi-source syntax.

**Inline JSON** also supports both formats:

```bash
# Format A: top-level key is the name
npx -y agent-add --mcp '{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}'

# Format B: auto-unwraps mcpServers
npx -y agent-add --mcp '{"mcpServers":{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}}'
```

agent-add automatically merges the config into the target host's config file (e.g. `.cursor/mcp.json` under `mcpServers`, Codex's TOML, etc.) — asset developers don't need to worry about host differences.

### Skill Directory

A Skill is a **directory** that must contain a `SKILL.md` entry file at the root:

```
my-skill/
├── SKILL.md          ← required
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

The entire directory is recursively copied to the host's skills directory (e.g. `.cursor/skills/my-skill/`).

### Prompt File (Rule file / System Prompt)

Plain Markdown file with no special format requirements:

```markdown
# Code Review Rules

Always review for security issues first.
Use bullet points for lists.
```

agent-add automatically selects the write strategy based on the host:

- **Append mode** (Cursor → `AGENTS.md`, Claude Code → `CLAUDE.md`, etc.): content is wrapped in HTML comment markers and appended to the file, ensuring idempotency:
  ```html
  <!-- agent-add:code-review-rules -->
  # Code Review Rules
  ...
  <!-- /agent-add:code-review-rules -->
  ```
- **Standalone file mode** (Windsurf → `.windsurf/rules/`, Roo Code → `.roo/rules/`, etc.): creates a `<name>.md` file in the rules directory

### Command File

Markdown file with optional YAML frontmatter:

```markdown
---
description: Run a comprehensive code review.
---

# code-review

Review the current file for bugs, security issues, and style violations.
```

Installed to the host's commands directory (e.g. `.cursor/commands/code-review.md`).

### Sub-agent File

Markdown + YAML frontmatter. Supports **`agent-add/<host>/<key>` host specialization syntax** — a single file can provide different frontmatter field values for different hosts. This is especially useful when specifying the model for a sub-agent.

For example, to use the fastest model on each host for a sub-agent:

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

During installation, agent-add will:
1. **Promote** matching `agent-add/<host>/*` values to top-level keys
2. **Remove** all `agent-add/*` prefixed keys

**After installing to Cursor:**

```markdown
---
name: playwright-tester
description: A playwright testing agent.
model: fast
---

# Playwright Test Agent

Plan and generate Playwright tests.
```

**After installing to Claude Code:**

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

A JSON file that bundles multiple assets for distribution:

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

**Field specification:**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Format `namespace/pack-name`, only `[a-zA-Z0-9_-]` allowed |
| `assets` | Yes | At least 1 item |
| `assets[].type` | Yes | `mcp` \| `skill` \| `prompt` \| `command` \| `subAgent` |
| `assets[].source` | Yes | String or array of strings (multi-source auto-expands into multiple assets) |

**Multi-source example** — install multiple MCP servers at once:

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

### Asset Name Inference

When no name is explicitly specified, agent-add infers it from the source string in this priority order:

| Source Type | Inference Rule | Example |
|-------------|---------------|---------|
| Inline JSON | Extract the single top-level key | `{"playwright":{...}}` → `playwright` |
| Inline Markdown | Extract the first `# heading`, convert to kebab-case | `# Code Review` → `code-review` |
| Git URL + `#path` | Take the last segment after `#` (strip extension) | `...git#skills/pdf` → `pdf` |
| Git URL without `#` | Take the repo name (strip `.git` suffix) | `...playwright.git` → `playwright` |
| Local path / HTTP | Take the filename (strip extension) | `./mcps/playwright.json` → `playwright` |

## Contributing

Contributions welcome! To add a new host, see the [Host Capability Matrix](./src/hosts/README.md).

## License

[Mozilla Public License 2.0](LICENSE)
