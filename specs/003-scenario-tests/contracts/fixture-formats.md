# Contract: Fixture File Formats

**Feature**: `003-scenario-tests`  
**Directory**: `tests/fixtures/`  
**Requirement**: FR-008, FR-009

---

## Overview

All fixture files are **static, read-only** inputs to the CLI. Scenario `Given` steps copy them into a temp working directory before invoking the CLI. Fixtures are never modified in place.

---

## `tests/fixtures/mcp/playwright.json`

**Asset type**: MCP  
**Validity**: ✅ Valid

Represents a minimal MCP server configuration object. This is the **value** object that gets merged into `mcpServers.<name>` in the target host config file.

```json
{
  "command": "npx",
  "args": ["@playwright/mcp@latest"],
  "env": {}
}
```

**Validation**: Must parse as JSON. Must have at least `command` (string) or `url` (string).

---

## `tests/fixtures/skill/my-skill/SKILL.md`

**Asset type**: Skill (valid)  
**Validity**: ✅ Valid

A skill directory must contain a `SKILL.md` entry file. The content is the skill documentation loaded by the AI host.

```markdown
---
name: my-skill
description: A test skill for scenario testing.
---

# Skill: my-skill

This is a test skill used in scenario tests.
```

**Validation**: The directory `my-skill/` must exist and contain `SKILL.md`. The CLI checks for the `SKILL.md` entry file before installing.

---

## `tests/fixtures/skill/bad-skill/README.md`

**Asset type**: Skill (invalid)  
**Validity**: ❌ Invalid (intentionally)

An invalid skill directory that does **not** contain `SKILL.md`. Used to test the CLI's error handling for malformed skill sources.

```markdown
# bad-skill

This directory is intentionally missing a SKILL.md file.
```

**Validation**: The `bad-skill/` directory must NOT contain `SKILL.md`. The CLI should return an error status for this fixture.

---

## `tests/fixtures/prompt/my-prompt.md`

**Asset type**: Prompt  
**Validity**: ✅ Valid

A prompt/rule file appended to the host's memory file (e.g., `AGENTS.md` for Cursor). Content is markdown text.

```markdown
# My Test Prompt

Always respond concisely.
Use bullet points for lists.
```

**Validation**: Must be a non-empty `.md` file. The CLI reads the full content and appends it (wrapped in `<!-- agent-get:<name> -->` markers).

---

## `tests/fixtures/command/my-command.md`

**Asset type**: Command  
**Validity**: ✅ Valid

A command/slash-command definition file. Installed as `<name>.md` in the host's commands directory.

```markdown
---
description: A test command for scenario testing.
---

# my-command

This is a test command used in scenario tests.
Run this command to perform a test action.
```

**Validation**: Must be a non-empty `.md` file. No schema constraints beyond valid markdown.

---

## `tests/fixtures/sub-agent/my-agent.md`

**Asset type**: Sub-agent  
**Validity**: ✅ Valid

A sub-agent definition file. Must contain `agent-get/*` frontmatter fields that the CLI strips on install.

```markdown
---
description: A test sub-agent for scenario testing.
agent-get/cursor/name: cursor-agent
agent-get/claude-code/name: claude-agent
---

# my-agent

This is a test sub-agent used in scenario tests.

## Instructions

Respond helpfully to all queries.
```

**Validation**: Must be a `.md` file. The `agent-get/*` fields are host-specific hints; the CLI strips them from the installed file.

---

## `tests/fixtures/pack/manifest.json`

**Asset type**: Pack (covers all 6 asset types)  
**Validity**: ✅ Valid

A complete pack manifest that declares assets of all 6 types using local relative paths. Paths are relative to the manifest file location.

```json
{
  "name": "test-pack",
  "version": "0.1.0",
  "description": "A test pack covering all asset types for scenario testing",
  "assets": [
    {
      "type": "mcp",
      "name": "playwright",
      "source": "../mcp/playwright.json"
    },
    {
      "type": "skill",
      "name": "my-skill",
      "source": "../skill/my-skill"
    },
    {
      "type": "prompt",
      "name": "my-prompt",
      "source": "../prompt/my-prompt.md"
    },
    {
      "type": "command",
      "name": "my-command",
      "source": "../command/my-command.md"
    },
    {
      "type": "subAgent",
      "name": "my-agent",
      "source": "../sub-agent/my-agent.md"
    }
  ]
}
```

> **Note**: A pack installs each asset via its corresponding handler. For hosts that don't support a given asset type (e.g., Claude Desktop only supports MCP), unsupported assets in the pack are skipped with a warning.

**Validation**: Must parse as JSON and conform to the pack manifest schema defined in `src/manifest/schema.ts`.

---

## Fixture Copying Convention

All `Given` steps that use fixtures must copy the fixture into the temp working directory using `cp` or `cp -r`:

```bash
# Single file fixture
cp "$PROJECT_ROOT/tests/fixtures/mcp/playwright.json" "$SETUP_TMPDIR/playwright.json"

# Directory fixture (skill)
cp -r "$PROJECT_ROOT/tests/fixtures/skill/my-skill" "$SETUP_TMPDIR/my-skill"

# Pack fixture (copies manifest; asset sources need to be co-located)
cp -r "$PROJECT_ROOT/tests/fixtures/" "$SETUP_TMPDIR/fixtures/"
```

The CLI is then invoked with a path relative to `$SETUP_TMPDIR` (which is the CWD during CLI execution).
