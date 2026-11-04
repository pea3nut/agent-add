# Host Configuration Reference

This file is the **single source of truth for host configuration in agent-add**: native file locations, schemas, registration, client/version boundaries and official sources. Each tool has its own section, with separate **Project scope** and **User scope (`--global`)** tables. Tools with no project installation target are labeled **global only**.

**Official sources rechecked for all 24 registered tools and both candidates: 2026-11-04 (UTC).** Sources are official product documentation unless explicitly labeled otherwise; descriptions are paraphrases, not verbatim quotations. Source links belong here, not in adapter metadata. Unselected targets remain unavailable rather than guessed.

## Reading This Reference

- Project paths are relative to the invocation's working directory. `~` is the current OS user's home, not the project root; user paths are native defaults, not a generic `~/.<host>` convention. Platform limits and config-root overrides appear with the affected tool.
- A file contract is not a similarly named UI feature, built-in command, cloud service or external agent. Skills that expose slash commands do not establish a separate Command asset.
- In user tables, **✅** marks a selected file contract, **↪** marks legacy or skill-backed behavior (read the row), **?** marks an unverified/unselected target, and **—** marks no independent installation contract. `?` and `—` are unavailable installer targets, not claims that the product lacks the feature. Claude Code's legacy Command files are installable; skill-backed commands use Skill instead.
- Project tables distinguish the upstream protocol from the selected installation target and its constraints. A documented native protocol can still be outside the installer contract, such as Kimi's parent-registered YAML agents.
- A Skill is the **whole directory bundle**, including `SKILL.md` and supporting scripts/resources. JSONC/TOML schemas, native frontmatter and required registrations are part of a contract, not just its filename.
- These are file-contract references, not proof that every native application has loaded the files. Trust, managed policy, disabled extensions, registration, restarts and native discovery precedence still apply. Local files are not automatically synchronized to cloud sessions.
- The [user-facing support tables](../../README.md#supported-hosts) summarize installable assets. [New host candidates](#new-host-candidates-not-implemented) are separate and are not accepted by `--host`.

## Installation Scope

`--global` selects user scope for the **entire invocation**. Without it, the scope is project, including for global-only hosts: an unsupported project request fails rather than silently selecting user scope.

| Concern | Project (default) | User (`--global`) |
|---------|-------------------|-------------------|
| Destination | The tool's project files and required project registrations | The tool's user files and required user registrations |
| Capability | Selected project contract for the host and asset type | Selected user contract; never inherited from project support |
| Source resolution | Relative local sources and pack manifests resolve from cwd | Same cwd-relative source resolution, even outside a repository |
| Conflicts | Only the selected project's destinations | Only the selected user's destinations; project copies do not cause conflicts or skips |
| Missing target | Explicit unsupported error, no user fallback | Explicit unsupported error, no project fallback |

- Repeated flags, all assets from `--pack`, and extra flags combined with a pack share one scope. Manifests have no per-asset scope setting. Install into both scopes with two invocations.
- Explicit unsupported assets fail before destination writes. Unsupported pack-only assets are reported as skipped in the selected scope; validation/write failures are errors, not unsupported-asset skips.
- `--host` selects the same ID in both scopes and is required in non-interactive use. Interactive selection identifies the scope; user installation does not depend on project detection.
- Installing in one scope does not migrate, delete, register or modify assets in the other. Same-name assets can coexist; which is loaded or merged follows the host's native precedence, not a universal project-over-user rule.
- Native root overrides are host-specific. Honor a verified override or report unsupported configuration before writing; never silently write to an unused default. No generic home-prefix rule defines a user contract.
- Preserve unrelated settings, comments where supported, file permissions and existing file-symlink behavior. Do not grant trust, bypass managed policy or rewrite embedded MCP commands, environment placeholders or resource references because scope changed.
- Installation results identify the selected scope and actual destination.

### User configuration roots

Only user destinations are relocated; sources still resolve from cwd. Overrides must be absolute paths. Unsupported combinations fail before any destination write.

| Host | Override handling | Official source |
|------|-------------------|-----------------|
| Claude Code | `CLAUDE_CONFIG_DIR` relocates instructions, skills, commands and agents. MCP with this override is rejected: the separate `.claude.json` relocation contract is not selected. | https://code.claude.com/docs/en/settings |
| Gemini CLI | `GEMINI_CLI_HOME` replaces the home **parent**; use `$GEMINI_CLI_HOME/.gemini/`, not `$GEMINI_CLI_HOME/settings.json`. | https://geminicli.com/docs/cli/enterprise/ |
| Qwen Code | `QWEN_HOME` replaces `~/.qwen/` for MCP, skills, commands and agents. Unset or empty uses the default. Qwen itself accepts relative and `~`-prefixed paths; this installer requires an absolute path and rejects those forms before writing. Project `.qwen/` is unaffected. | https://qwenlm.github.io/qwen-code-docs/en/users/configuration/settings/ |
| Codex | `CODEX_HOME` relocates config, instructions and agents, not `$HOME/.agents/skills`. | https://developers.openai.com/codex/guides/agents-md ; https://developers.openai.com/codex/skills |
| Vibe | `VIBE_HOME` replaces `~/.vibe/` for selected user assets. | https://docs.mistral.ai/vibe/code/cli/configuration |
| Cline CLI | `CLINE_DIR` replaces `~/.cline/`; `CLINE_DATA_DIR` replaces its `data/`; `CLINE_MCP_SETTINGS_PATH` selects the MCP file directly and takes precedence. | https://docs.cline.bot/cli/cli-reference ; https://docs.cline.bot/mcp/mcp-overview |
| OpenClaw | `OPENCLAW_STATE_DIR` relocates state-owned skills. Non-default `OPENCLAW_PROFILE` and `OPENCLAW_HOME` combinations are not selected and are rejected. | https://docs.openclaw.ai/tools/skills ; https://docs.openclaw.ai/concepts/agent-workspace |
| Kimi | MCP with `KIMI_SHARE_DIR` is not selected and is rejected; the verified user skill path is independent of this variable. | https://moonshotai.github.io/kimi-cli/en/customization/skills.html |
| GitHub Copilot | Custom `COPILOT_HOME` user skill/agent roots are not selected and are rejected rather than guessed from MCP configuration. | https://code.visualstudio.com/docs/agent-customization/mcp-servers ; https://docs.github.com/en/copilot/concepts/agents/about-agent-skills |
| opencode | `OPENCODE_CONFIG`, `OPENCODE_CONFIG_DIR` and inline `OPENCODE_CONFIG_CONTENT` are additional configuration layers, not a generic relocation rule; these custom configurations are rejected for user installation. | https://opencode.ai/docs/config/ |

Custom `XDG_CONFIG_HOME` handling is not selected for opencode, Kilo, Amp, Zed instructions or goose hints; affected user operations fail explicitly rather than guessing relocated paths. This does not relocate independent `$HOME/.agents/skills` roots. Native application command-line overrides (for example Amp `--settings-file`) are not read from a different running process.

## Host File Contracts

### Cursor

Host ID: `cursor`

Homepage: https://cursor.com/docs

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://cursor.com/docs/context/mcp | Project `.cursor/mcp.json`; key `mcpServers` | `.cursor/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://cursor.com/docs/context/rules | Native rules use `.cursor/rules/*.mdc`; `AGENTS.md` is also supported as a cross-tool standard | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://cursor.com/docs/skills | Project `.cursor/skills/` and `.agents/skills/`; each bundle contains `SKILL.md` | Keep `.cursor/skills/<name>/SKILL.md` as the host-specific target; copy the directory bundle |
| Command | https://cursor.com/changelog/1-6 ; https://cursor.com/docs/skills | The v1.6 `.cursor/commands/<name>.md` contract is legacy; current docs recommend `/migrate-to-skills` to migrate commands to skills | Mark as legacy; prefer `.cursor/skills/<name>/SKILL.md` for new reusable workflows. A redirect to the skills page is not current evidence for the old command path |
| Sub-agent | https://cursor.com/docs/subagents | Project `.cursor/agents/`; Markdown format | `.cursor/agents/<name>.md` (strategy: `copy-file`) |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://cursor.com/docs/context/mcp | `~/.cursor/mcp.json` → `mcpServers`. |
| Prompt | ? | https://cursor.com/docs/context/rules | User Rules are managed in the settings UI. No writable user instruction-file contract selected; do not invent `~/.cursor/AGENTS.md`. |
| Skill | ✅ | https://cursor.com/docs/skills | `~/.cursor/skills/<name>/SKILL.md`; copy the whole bundle. |
| Command | ? | https://cursor.com/docs/skills | No verified user command-file target selected. The legacy project command directory does not establish a user target. |
| Sub-agent | ✅ | https://cursor.com/docs/subagents | `~/.cursor/agents/<name>.md`; native Markdown agent metadata. |

### Claude Code

Host ID: `claude-code`

Homepage: https://code.claude.com/docs/en

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://code.claude.com/docs/en/mcp | Shared project `.mcp.json`, key `mcpServers`; HTTP servers require `type: "http"` | `.mcp.json` → key `mcpServers`; do not omit the remote transport type or overwrite unrelated configuration |
| Prompt | https://code.claude.com/docs/en/memory | `./CLAUDE.md` or `./.claude/CLAUDE.md` | `CLAUDE.md` in project root (strategy: `append-with-marker`) |
| Skill | https://code.claude.com/docs/en/skills | Project `.claude/skills/<skill-name>/SKILL.md` | `.claude/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://code.claude.com/docs/en/skills | Commands have merged into skills; `.claude/commands/` remains backward-compatible | Existing `.claude/commands/<name>.md` files remain usable; prefer `.claude/skills/<name>/SKILL.md` for new workflows |
| Sub-agent | https://code.claude.com/docs/en/sub-agents | Project `.claude/agents/`; Markdown with YAML frontmatter | `.claude/agents/<name>.md` (strategy: `copy-file`) |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://code.claude.com/docs/en/mcp#user-scope | `~/.claude.json` → top-level `mcpServers` (**user** scope), not `projects[<path>]` (**local** scope) in the same file. Never `~/.claude/.mcp.json`. Preserve native HTTP/SSE transport types. |
| Prompt | ✅ | https://code.claude.com/docs/en/memory | `~/.claude/CLAUDE.md`. |
| Skill | ✅ | https://code.claude.com/docs/en/skills | `~/.claude/skills/<name>/SKILL.md`; copy the whole bundle. |
| Command | ↪ | https://code.claude.com/docs/en/skills | `~/.claude/commands/<name>.md` is backward-compatible. Commands have merged into skills; prefer Skill for new workflows. |
| Sub-agent | ✅ | https://code.claude.com/docs/en/sub-agents | `~/.claude/agents/<name>.md`; Markdown with YAML frontmatter. |

### GitHub Copilot

Host ID: `github-copilot`

Homepage: https://docs.github.com/en/copilot

Scope: the adapter's MCP target is **VS Code**, not Copilot CLI/cloud configuration. Do not write `.vscode/mcp.json` and claim CLI support.

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://code.visualstudio.com/docs/agent-customization/mcp-servers | VS Code workspace `.vscode/mcp.json` ; key `servers`. These remain available for compatibility and are labeled deprecated in the guided flow | Preserve `servers` for the existing VS Code target. Portable project `.mcp.json` uses `mcpServers`; interactive-input servers are not forwarded to Copilot harness sessions. Select the destination and harness explicitly; do not merely rename the key |
| Prompt | https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot | `.github/copilot-instructions.md`; also supports `.github/instructions/*.instructions.md` and `AGENTS.md` | `.github/copilot-instructions.md` (strategy: `append-with-marker`) |
| Skill | https://docs.github.com/en/copilot/concepts/agents/about-agent-skills | Project `.github/skills/`, `.claude/skills/`, `.agents/skills/` | `.github/skills/<name>/SKILL.md` requires frontmatter (name, description) and the complete directory bundle |
| Command | https://docs.github.com/en/copilot/tutorials/customization-library/prompt-files/your-first-prompt-file | `.github/prompts/<name>.prompt.md`; YAML frontmatter; invoked with `/<name>` | `.github/prompts/<name>.prompt.md` (strategy: `copy-file`) |
| Sub-agent | https://code.visualstudio.com/docs/agents/reference/custom-agent-file-reference | VS Code project `.github/agents/`, also `.claude/agents/`; Markdown with YAML frontmatter | `.github/agents/<name>.agent.md`; follow the VS Code schema rather than substituting cloud-agent field constraints |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP / Prompt / Command | ? | https://code.visualstudio.com/docs/agent-customization/mcp-servers | No user target selected for these assets. Copilot Global MCP (`$COPILOT_HOME/mcp-config.json`) and VS Code profile MCP are distinct from this adapter's workspace compatibility schema. |
| Skill | ✅ | https://docs.github.com/en/copilot/concepts/agents/about-agent-skills | `~/.copilot/skills/<name>/SKILL.md`; copy the whole bundle. |
| Sub-agent | ✅ | https://code.visualstudio.com/docs/agents/reference/custom-agent-file-reference | `~/.copilot/agents/<name>.agent.md`; user custom agents, not VS Code profile storage. |

### Gemini CLI

Host ID: `gemini`

Homepage: https://geminicli.com/

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://geminicli.com/docs/tools/mcp-server/ | Project `.gemini/settings.json`; key `mcpServers`; `url` selects SSE and `httpUrl` selects Streamable HTTP | Preserve native `httpUrl`; normalize explicit HTTP transport aliases to `httpUrl`, and SSE to `url`. A bare `url` retains native SSE semantics. Reject mixed endpoint fields or conflicting transport selectors. |
| Prompt | https://geminicli.com/docs/cli/gemini-md/ | Defaults to project-hierarchy `GEMINI.md` files; `context.fileName` can specify another name or a list of names, such as `AGENTS.md` | Default target: `GEMINI.md`; respect the user's configured context filenames instead of claiming the default file is always loaded |
| Skill | https://geminicli.com/docs/cli/skills/ | Project `.gemini/skills/` or `.agents/skills/` | Within the same scope, `.agents/skills/` takes precedence over `.gemini/skills/`; `.gemini/skills/<name>/SKILL.md` remains a valid host-specific target |
| Command | https://geminicli.com/docs/cli/custom-commands/ | Project `.gemini/commands/`; TOML with required `prompt` and optional `description` | `.gemini/commands/<name>.toml`; serialize TOML rather than renaming Markdown; reload with `/commands reload` |
| Sub-agent | https://geminicli.com/docs/core/subagents/ | Project `.gemini/agents/*.md`; Markdown with YAML frontmatter | `.gemini/agents/<name>.md` (strategy: `copy-file`) |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://geminicli.com/docs/reference/configuration/ ; https://geminicli.com/docs/tools/mcp-server/ | `~/.gemini/settings.json` → `mcpServers`. Use `httpUrl` for Streamable HTTP and `url` for SSE; preserve headers and unrelated settings. |
| Prompt | ✅ | https://geminicli.com/docs/cli/gemini-md/ | Default `~/.gemini/GEMINI.md`; respect the effective user `context.fileName`. Project settings do not redirect a user-level write. |
| Skill | ✅ | https://geminicli.com/docs/cli/skills/ | `~/.gemini/skills/<name>/SKILL.md`; preserve supporting resources and native discovery precedence. |
| Command | ✅ | https://geminicli.com/docs/cli/custom-commands/ | `~/.gemini/commands/<name>.toml`; required `prompt`, optional `description`. Serialize TOML, not renamed Markdown. |
| Sub-agent | ✅ | https://geminicli.com/docs/core/subagents/ ; https://geminicli.com/docs/reference/commands/ | `~/.gemini/agents/<name>.md`; Markdown with YAML frontmatter. |

### Kilo Code

Host ID: `kilo-code`

Homepage: https://kilo.ai/docs

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://kilo.ai/docs/automate/mcp/using-in-kilo-code | Project `kilo.jsonc` / `.kilo/kilo.jsonc` (also supports `.json`); top-level `mcp` | Local: `{type: "local", command: [exe, ...args], environment: {...}}`; remote: `{type: "remote", url: ...}`; requires JSONC-aware merging and schema conversion |
| Prompt | https://kilo.ai/docs/customize/custom-rules | Reference `.kilo/rules/<name>.md` through file paths or globs in `kilo.jsonc`'s `instructions`; legacy `.kilocode/rules/` is automatically compatible | New installations must write the rule file **and** register it in `instructions`; creating the new directory alone is insufficient |
| Skill | https://kilo.ai/docs/customize/skills | Project `.kilo/skills/` | `.kilo/skills/<name>/SKILL.md`; YAML frontmatter (name, description); do not retain old directories unverified by current docs |
| Command | https://kilo.ai/docs/customize/workflows | Project `.kilo/commands/`; legacy `.kilocode/workflows/` is migrated automatically | `.kilo/commands/<name>.md`, not `.kilocode/commands/` |
| Sub-agent | https://kilo.ai/docs/customize/custom-subagents | Project `.kilo/agents/`; Markdown with YAML frontmatter | `.kilo/agents/<name>.md`; agents can also be defined under `agent` in `kilo.jsonc` |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://kilo.ai/docs/automate/mcp/using-in-kilo-code | `~/.config/kilo/kilo.jsonc` → `mcp`. Preserve existing `.json`/`.jsonc` selection and comments; use native local/remote schema conversion. |
| Prompt | ? | https://kilo.ai/docs/customize/custom-rules | No verified user rule target and `instructions` registration contract selected. Project registration is not evidence for a global path. |
| Skill | ✅ | https://kilo.ai/docs/customize/skills | `~/.kilo/skills/<name>/SKILL.md`. The skill root differs from the config/command/agent root. |
| Command | ✅ | https://kilo.ai/docs/customize/workflows | `~/.config/kilo/commands/<name>.md`. |
| Sub-agent | ✅ | https://kilo.ai/docs/customize/custom-subagents | `~/.config/kilo/agents/<name>.md`; native YAML frontmatter. |

### Qwen Code

Host ID: `qwen-code`

Homepage: https://qwenlm.github.io/qwen-code-docs/en/

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/ | `.qwen/settings.json`; key `mcpServers`; `url` selects SSE and `httpUrl` selects Streamable HTTP | Same transport normalization and ambiguity rejection as Gemini CLI; preserve headers and unrelated settings. |
| Prompt | https://qwenlm.github.io/qwen-code-docs/en/blog/updates/weekly-update-2026-03-06/ | The official update confirms automatic loading of project-root `AGENTS.md`; do not promise a fixed conflict precedence against `QWEN.md` without evidence | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/ | Project `.qwen/skills/<skill-name>/SKILL.md` | `.qwen/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.qwen/skills`) |
| Command | https://qwenlm.github.io/qwen-code-docs/en/users/features/commands/ | Custom Commands section: project `.qwen/commands/`; Markdown with optional YAML frontmatter; legacy TOML is deprecated | `.qwen/commands/<name>.md`; project definitions win on name conflicts; subdirectories become colon-separated namespaces |
| Sub-agent | https://qwenlm.github.io/qwen-code-docs/en/users/features/sub-agents/ | Project `.qwen/agents/`; Markdown with YAML frontmatter | `.qwen/agents/<name>.md` (strategy: `copy-file`, installDir: `.qwen/agents`) |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://qwenlm.github.io/qwen-code-docs/en/users/configuration/settings/ ; https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/ | `~/.qwen/settings.json` → `mcpServers`, or `$QWEN_HOME/settings.json`; preserve native HTTP/SSE fields and unrelated settings. |
| Prompt | ? | https://qwenlm.github.io/qwen-code-docs/en/blog/updates/weekly-update-2026-03-06/ | The project `AGENTS.md` contract does not establish a user instruction target. None selected here. |
| Skill | ✅ | https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/ | `~/.qwen/skills/<name>/SKILL.md`, or `$QWEN_HOME/skills/<name>/SKILL.md`; copy the whole bundle. |
| Command | ✅ | https://qwenlm.github.io/qwen-code-docs/en/users/features/commands/ | `~/.qwen/commands/<name>.md`, or `$QWEN_HOME/commands/<name>.md`; Markdown with optional YAML frontmatter, not deprecated TOML. |
| Sub-agent | ✅ | https://qwenlm.github.io/qwen-code-docs/en/users/features/sub-agents/ | `~/.qwen/agents/<name>.md`, or `$QWEN_HOME/agents/<name>.md`; Markdown with YAML frontmatter; project definitions take precedence. |

### opencode

Host ID: `opencode`

Homepage: https://opencode.ai/docs

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://opencode.ai/docs/mcp-servers/ ; https://opencode.ai/docs/config/ ; https://opencode.ai/config.json | Project `opencode.json` / `opencode.jsonc`; top-level `mcp`. The config reference documents project paths and precedence | Local servers use `type: "local"`, `command: [exe, ...args]`, and `environment`; remote servers use `type: "remote"` and `url`. Do not copy server objects directly from `mcpServers` |
| Prompt | https://opencode.ai/docs/rules | Project-root `AGENTS.md`; also supports a `CLAUDE.md` fallback | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://opencode.ai/docs/skills | Project `.opencode/skills/<name>/SKILL.md` | `.opencode/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.opencode/skills`) |
| Command | https://opencode.ai/docs/commands | Project `.opencode/commands/`; Markdown with YAML frontmatter | `.opencode/commands/<name>.md` (strategy: `copy-file`, installDir: `.opencode/commands`) |
| Sub-agent | https://opencode.ai/docs/agents | Project `.opencode/agents/`; Markdown with YAML frontmatter | `.opencode/agents/<name>.md` (strategy: `copy-file`, installDir: `.opencode/agents`) |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://opencode.ai/docs/config/ ; https://opencode.ai/docs/mcp-servers/ | `~/.config/opencode/opencode.json` / `opencode.jsonc` → `mcp`; JSONC-aware merging and native local/remote conversion. `OPENCODE_CONFIG` is an additional layer, not a replacement global default. |
| Prompt | ✅ | https://opencode.ai/docs/rules | `~/.config/opencode/AGENTS.md`. |
| Skill | ✅ | https://opencode.ai/docs/skills | `~/.config/opencode/skills/<name>/SKILL.md`; copy the whole bundle. |
| Command | ✅ | https://opencode.ai/docs/commands | `~/.config/opencode/commands/<name>.md`; native YAML frontmatter. |
| Sub-agent | ✅ | https://opencode.ai/docs/agents | `~/.config/opencode/agents/<name>.md`; retain native subagent metadata. |

### Augment

Host ID: `augment`

Homepage: https://docs.augmentcode.com/

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.augmentcode.com/cli/integrations ; https://docs.augmentcode.com/cli/settings | **Auggie CLI** project `.augment/settings.json`; local override `.augment/settings.local.json`; key `mcpServers` | The settings reference explicitly supports JSONC, including comments and trailing commas. For the IDE extension's settings panel / Import from JSON, see https://docs.augmentcode.com/setup-augment/mcp ; do not assume it shares the CLI file |
| Prompt | https://docs.augmentcode.com/setup-augment/guidelines | Project `.augment/rules/`; also supports `AGENTS.md`/`CLAUDE.md` | `.augment/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.augment/rules`) |
| Skill | https://docs.augmentcode.com/using-augment/skills | Project `.augment/skills/`; compatible with `.agents/skills/` and `.claude/skills/` | `.augment/skills/<name>/SKILL.md`; copy the directory bundle and respect host discovery precedence |
| Command | https://docs.augmentcode.com/using-augment/custom-commands | Project `.augment/commands/<name>.md` | `.augment/commands/<name>.md` (strategy: `copy-file`, installDir: `.augment/commands`) |
| Sub-agent | https://docs.augmentcode.com/cli/subagents | Project `.augment/agents/`; Markdown with YAML frontmatter | `.augment/agents/<name>.md` (strategy: `copy-file`, installDir: `.augment/agents`) |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://docs.augmentcode.com/cli/settings ; https://docs.augmentcode.com/cli/integrations | **Auggie CLI** `~/.augment/settings.json` → `mcpServers`. Preserve JSONC comments; this is not an IDE-extension private-settings contract. |
| Prompt | ✅ | https://docs.augmentcode.com/setup-augment/guidelines | `~/.augment/rules/<name>.md`; documented user rules directory. IDE user guidelines also have a separate `~/.augment/user-guidelines.md` target, which this adapter does not modify. |
| Skill | ✅ | https://docs.augmentcode.com/using-augment/skills | `~/.augment/skills/<name>/SKILL.md`; copy the whole bundle. |
| Command | ✅ | https://docs.augmentcode.com/using-augment/custom-commands | `~/.augment/commands/<name>.md`. |
| Sub-agent | ✅ | https://docs.augmentcode.com/cli/subagents | `~/.augment/agents/<name>.md`; Markdown with YAML frontmatter. |

### Windsurf

Host ID: `windsurf`

Official legacy reference: https://docs.devin.ai/desktop/cascade

Scope: the registered `windsurf` ID refers to legacy Windsurf/Cascade, **not Devin Local**. Former Windsurf documentation URLs now redirect to Devin documentation. Current Devin Desktop no longer starts or reopens Cascade conversations; the workflow contracts below are historical, not new Devin Local capabilities. Current documentation retains some `.windsurf/` project directories for compatibility, but that does not verify every historical MCP path.

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.devin.ai/desktop/devin-local/customizations#mcp-servers | — | Not supported: no verified project MCP target for this adapter. Devin Local is a different host contract, not a replacement path for `windsurf` |
| Prompt | https://docs.devin.ai/desktop/devin-local/customizations#rules | `.windsurf/rules/*.md` is a legacy compatibility directory; current documentation prefers `.devin/rules/*.md` | `.windsurf/rules/<name>.md` is a legacy target (strategy: `create-file-in-dir`); keep client/version scope explicit rather than presenting it as the preferred current directory |
| Skill | https://docs.devin.ai/desktop/devin-local/customizations#skills | Project `.windsurf/skills/` is read for legacy compatibility; current Devin Local prefers `.devin/skills/` . Bundles contain `SKILL.md` with name/description frontmatter | `.windsurf/skills/<name>/SKILL.md` is a legacy project target. |
| Command | https://docs.devin.ai/desktop/cascade#workflows | Cascade-only workflows: preferred `.devin/workflows/*.md`, legacy `.windsurf/workflows/*.md` fallback. **Devin Local does not support workflows** | `.windsurf/workflows/<name>.md` is a historical Cascade target, not a Devin Local command directory. Migrate workflows to skills for Devin Local |
| Sub-agent | — | No standalone sub-agent file installation contract verified | Do not infer automatic discovery in `.windsurf/agents/` from built-in parallelism |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP / Prompt / Skill | ? | https://docs.devin.ai/desktop/devin-local/customizations | Current Devin Local user paths do not establish legacy Cascade user targets; none selected. |
| Command | ✅ | https://docs.devin.ai/desktop/cascade#workflows | Legacy Cascade global workflows: `~/.codeium/windsurf/global_workflows/<name>.md`; explicitly documented separately from Devin Local customizations. |
| Sub-agent | — | — | No independent user agent-file contract verified. |

### Roo Code

Host ID: `roo-code`

Homepage: https://docs.roocode.com/

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.roocode.com/features/mcp/using-mcp-in-roo | Project `.roo/mcp.json`; key `mcpServers` | `.roo/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.roocode.com/features/custom-instructions | `.roo/rules/` is loaded recursively in filename order; also supports `.roo/rules-{modeSlug}/` | `.roo/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.roo/rules`) |
| Skill | https://docs.roocode.com/features/skills | Project `.roo/skills/`; also reads `.agents/skills/`; supports mode-specific `.roo/skills-{modeSlug}/` | `.roo/skills/<name>/SKILL.md` requires name and description in frontmatter; copy the complete directory bundle |
| Command | https://docs.roocode.com/features/slash-commands | `.roo/commands/`; filenames define command names, e.g. `review.md` → `/review` | `.roo/commands/<name>.md` (strategy: `copy-file`, installDir: `.roo/commands`) |
| Sub-agent | https://docs.roocode.com/features/custom-modes | Custom modes use `.roomodes` / `custom_modes.yaml`, not standalone drop-in sub-agent Markdown files | This audit does not equate mode configuration with a Sub-agent asset; do not create an unverified `.roo/agents/` directory |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ? | https://docs.roocode.com/features/mcp/using-mcp-in-roo | Global `mcp_settings.json` is opened through the editor UI; no portable absolute path selected. Do not move project `.roo/mcp.json` under home. |
| Prompt | ✅ | https://docs.roocode.com/features/custom-instructions | `~/.roo/rules/<name>.md`; global rules are loaded before workspace rules. |
| Command | ✅ | https://docs.roocode.com/features/slash-commands | `~/.roo/commands/<name>.md`; project commands override same-name global commands. |
| Skill | ✅ | https://docs.roocode.com/features/skills | `~/.roo/skills/<name>/SKILL.md`; copy the whole bundle. |
| Sub-agent | — | — | Custom modes are not a standalone user sub-agent file contract. |

### Kiro

Host ID: `kiro`

Homepage: https://kiro.dev/docs/

Scope: current docs cover **IDE 1.0 / CLI V3**. CLI 2.x JSON agent settings have migration differences; do not treat all Kiro versions as interchangeable.

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://kiro.dev/docs/mcp/configuration/ | Workspace `.kiro/settings/mcp.json`; key `mcpServers` | `.kiro/settings/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://kiro.dev/docs/steering/ | Project `.kiro/steering/`; also loads `AGENTS.md`; supports inclusion frontmatter | `.kiro/steering/<name>.md`; custom agents must explicitly include steering in `resources`, e.g. `file://.kiro/steering/**/*.md` |
| Skill | https://kiro.dev/docs/skills/ | `.kiro/skills/<name>/SKILL.md` | The default agent discovers skills automatically; custom agents need `skill://` URIs in `resources`. Copying files alone does not guarantee availability |
| Command | https://kiro.dev/docs/skills/ ; https://kiro.dev/docs/steering/ | Skills and manual/auto steering can be invoked as slash commands | Reuse the Skill/Prompt contracts; no independent `.kiro/commands/` directory verified |
| Sub-agent | https://kiro.dev/docs/custom-agents/configuration-reference/ ; https://kiro.dev/docs/custom-agents/subagents/ | Workspace `.kiro/agents/`; the current format supports Markdown frontmatter and a prompt body | `.kiro/agents/<name>.md`; document version and `resources`/`includeMcpJson` behavior; migrate legacy JSON with `/upgrade-agent` |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://kiro.dev/docs/mcp/configuration/ | `~/.kiro/settings/mcp.json` → `mcpServers`; preserve native disabled/tool-list fields. |
| Prompt | ✅ | https://kiro.dev/docs/steering/ | `~/.kiro/steering/<name>.md`; native steering metadata. |
| Skill | ✅ | https://kiro.dev/docs/skills/ | `~/.kiro/skills/<name>/SKILL.md`; custom agents still require resource/skill registration. |
| Command | ↪ | https://kiro.dev/docs/skills/ | Skill-backed invocation, not an independent Command directory. |
| Sub-agent | ✅ | https://kiro.dev/docs/custom-agents/creating/ ; https://kiro.dev/docs/custom-agents/configuration-reference/ | `~/.kiro/agents/<name>.md`; CLI V3 / IDE 1.0 Markdown custom-agent format, not CLI 2.x JSON. Preserve required `resources` registration. |

### Codex CLI

Host ID: `codex`

Homepage: https://github.com/openai/codex

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://developers.openai.com/codex/config-basic/ ; https://developers.openai.com/codex/mcp/ ; https://github.com/openai/codex/blob/main/codex-rs/core/config.schema.json | Project `.codex/config.toml`, `[mcp_servers.<name>]`; project configuration is loaded only for trusted projects | Serialize stdio and HTTP entries as TOML, preserving environment variables and HTTP headers. The installer does not grant project trust. |
| Prompt | https://developers.openai.com/codex/guides/agents-md | `AGENTS.md` at the repository root and in subdirectories | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://developers.openai.com/codex/skills | Searches `.agents/skills/` at each project level from cwd to the repository root | `.agents/skills/<name>/SKILL.md`; `.codex/skills/` is no longer the current officially recommended path; include name/description frontmatter |
| Command | https://developers.openai.com/codex/skills | No standalone project command target selected; use project skills | Not supported as an independent asset |
| Sub-agent | https://developers.openai.com/codex/subagents | Standalone TOML files in project `.codex/agents/`; require name/description/developer_instructions | `.codex/agents/<name>.toml` (strategy: `copy-file`, installDir: `.codex/agents`) |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://developers.openai.com/codex/config-basic/ ; https://developers.openai.com/codex/mcp/ | `~/.codex/config.toml` → `[mcp_servers.<name>]`; stdio/HTTP schema, native options and TOML-preserving merge. |
| Prompt | ✅ | https://developers.openai.com/codex/guides/agents-md | `~/.codex/AGENTS.md`; update the effective non-empty `AGENTS.override.md` when present rather than an ignored default file. |
| Skill | ✅ | https://developers.openai.com/codex/skills | `~/.agents/skills/<name>/SKILL.md`; copy the whole bundle. `CODEX_HOME` does **not** relocate this documented `$HOME/.agents/skills` root. |
| Command | — | — | No independent command-file target selected. |
| Sub-agent | ✅ | https://developers.openai.com/codex/subagents | `~/.codex/agents/<name>.toml`; serialize native TOML rather than copy Markdown. `CODEX_HOME` relocates the config/instructions root; do not infer unrelated skill paths from it. |

### Tabnine (IDE Agent / CLI)

Host ID: `tabnine`

Homepage: https://docs.tabnine.com/

Scope: the MCP and guidelines sources describe **Tabnine IDE Agent**; the command source describes **Tabnine CLI**. Cross-client discovery has not been runtime-verified.

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.tabnine.com/main/getting-started/tabnine-agent/mcp-intro-and-setup | `.tabnine/mcp_servers.json` under the project directory; key `mcpServers` | `.tabnine/mcp_servers.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.tabnine.com/main/getting-started/tabnine-agent/guidelines | `$PROJECT/.tabnine/guidelines/`; Markdown format | `.tabnine/guidelines/<name>.md` (strategy: `create-file-in-dir`, installDir: `.tabnine/guidelines`) |
| Skill | — | No official contract sufficient to confirm automatic CLI skill-directory discovery found in this audit | Do not rely on third-party lists to claim support or assert that the product has no skills at all |
| Command | https://docs.tabnine.com/main/getting-started/tabnine-cli/features/commands | Project `.tabnine/agent/commands/`; **TOML** with `prompt` and optional `description` | `.tabnine/agent/commands/<name>.toml`; nested directories produce `/namespace:command`; the old documentation link no longer works |
| Sub-agent | — | No standalone CLI sub-agent file contract verified | Do not infer a `.tabnine/agents/` directory |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://docs.tabnine.com/main/getting-started/tabnine-agent/mcp-intro-and-setup | **IDE Agent:** `~/.tabnine/mcp_servers.json` → `mcpServers`. A workspace folder must be open for the MCP engine to read local or global configuration. |
| Prompt | ? | https://docs.tabnine.com/main/getting-started/tabnine-agent/guidelines | Only the project guidelines directory is selected. |
| Command | ✅ | https://docs.tabnine.com/main/getting-started/tabnine-cli/features/commands | **CLI:** `~/.tabnine/agent/commands/<name>.toml`; required `prompt`, optional `description`. |
| Skill / Sub-agent | — | — | No standalone user file contract selected. |

### Kimi Code

Host ID: `kimi`

Homepage: https://moonshotai.github.io/kimi-cli/

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://moonshotai.github.io/kimi-cli/en/customization/mcp.html | No verified project-level automatic-discovery target selected | Not supported; do not create an arbitrary project MCP file |
| Prompt | https://moonshotai.github.io/kimi-cli/en/customization/agents.html | The `${KIMI_AGENTS_MD}` variable merges `AGENTS.md` files from the project root to the working directory, including `.kimi/AGENTS.md` | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://moonshotai.github.io/kimi-cli/en/customization/skills.html | Project `.kimi/skills/` and `.agents/skills/`; compatible with `.claude/skills/`, `.codex/skills/`, and other paths; see official docs for name-conflict precedence | `.kimi/skills/<name>/SKILL.md` with YAML frontmatter; compatibility paths establish Kimi discovery, not a continued Codex recommendation for the old path |
| Command | https://moonshotai.github.io/kimi-cli/en/customization/skills.html | Official docs describe loading skills through slash commands, not an independent command-file directory | Reuse the Skill contract; do not invent `.kimi/commands/` |
| Sub-agent | https://moonshotai.github.io/kimi-cli/en/customization/agents.html | YAML `version: 1` / `agent`; a parent agent's `subagents.<name>` entries contain `path` and `description`, referencing child-agent YAML; `system_prompt_path` can reference Markdown | Install YAML and prompt dependencies, register them in the parent, and load it with `kimi --agent-file <parent.yaml>`; automatic discovery in `.kimi/agents/` is unverified. Copying one `.md` is insufficient |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://moonshotai.github.io/kimi-cli/en/customization/mcp.html | `~/.kimi/mcp.json` → `mcpServers`. This does not enable a project MCP target. |
| Prompt | ? | https://moonshotai.github.io/kimi-cli/ | No user instruction target selected. |
| Skill | ✅ | https://moonshotai.github.io/kimi-cli/en/customization/skills.html | `~/.kimi/skills/<name>/SKILL.md`; skills are independent of `KIMI_SHARE_DIR`. |
| Command | ↪ | https://moonshotai.github.io/kimi-cli/ | Skill-backed invocation is not a standalone Command format. |
| Sub-agent | — | https://moonshotai.github.io/kimi-cli/ | YAML agent files require parent registration and `--agent-file` selection, not a Markdown drop-in user asset. |

### Trae

Host ID: `trae`

Homepage: https://docs.trae.ai/

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.trae.ai/ide/add-mcp-servers | Project `.trae/mcp.json`; key `mcpServers`; requires enabling **Project MCP** in Settings > MCP | `.trae/mcp.json` → key `mcpServers`; writing a file does not bypass user trust or enablement steps |
| Prompt | https://docs.trae.ai/ide/rules | `.trae/rules/`; each rule is a `.md` file with YAML frontmatter (alwaysApply, description, globs); also compatible with AGENTS.md | `.trae/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.trae/rules`) |
| Skill | https://docs.trae.ai/ide/skills | Project `.trae/skills/{skill_name}/SKILL.md`; YAML frontmatter (name, description) | `.trae/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.trae/skills`) |
| Command | — | No standalone custom slash-command file contract verified | Do not equate built-in slash menus with automatic file discovery |
| Sub-agent | — | No installable standalone sub-agent file contract verified in this audit | Custom agents in the UI do not establish a `.trae/agents/` contract |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ? | https://docs.trae.ai/ide/add-mcp-servers | Global MCP is configured through the UI; no file path selected. |
| Prompt | ? | https://docs.trae.ai/ide/rules | The docs name `~/.trae/user_rules`, but do not establish a per-asset Markdown filename/schema here. No installer target selected. |
| Skill | ✅ | https://docs.trae.ai/ide/skills | `~/.trae/skills/<name>/SKILL.md`; Windows uses `%USERPROFILE%/.trae/skills`. |
| Command / Sub-agent | — | — | No standalone user file contract selected. |

### OpenClaw (global only)

Host ID: `openclaw`

Homepage: https://docs.openclaw.ai/

No project installation target is selected. Use `--global`; there is no automatic scope fallback.

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ? | https://docs.openclaw.ai/gateway/configuration ; https://docs.openclaw.ai/gateway/config-extensions | No automatic MCP installation contract selected; the existence of `openclaw.json` is insufficient evidence. |
| Prompt | ? | https://docs.openclaw.ai/concepts/agent-workspace ; https://docs.openclaw.ai/gateway/configuration | `~/.openclaw/workspace/AGENTS.md` belongs to a configured agent workspace, not a universal user prompt. No user Prompt target selected. |
| Skill | ✅ | https://docs.openclaw.ai/tools/skills ; https://docs.openclaw.ai/gateway/configuration | `~/.openclaw/skills/<name>/SKILL.md` in the default state; shared state-owned skill root, not the agent workspace. Respect verified profile/state-root overrides or report an unsupported configuration. |
| Command / Sub-agent | — | https://docs.openclaw.ai/tools/slash-commands | Built-in slash commands and workspace configuration do not establish independent user Command/Sub-agent file targets. |

### Mistral Vibe

Host ID: `vibe`

Homepage: https://docs.mistral.ai/vibe/code/cli/

#### Project scope

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.mistral.ai/vibe/code/cli/configuration ; https://docs.mistral.ai/vibe/code/cli/configuration-reference | `.vibe/config.toml`; `[[mcp_servers]]` array; each entry requires `name` and `transport`, with other fields depending on transport | `.vibe/config.toml`; preserve TOML arrays of tables, distinct from Codex's `[mcp_servers.<name>]` |
| Prompt | https://docs.mistral.ai/vibe/code/cli/agents | Every `AGENTS.md` between cwd and the trusted root in a trusted workspace | `AGENTS.md` in project root; respect trusted-folder boundaries |
| Skill | https://docs.mistral.ai/vibe/code/cli/skills | Project `.vibe/skills/` / `.agents/skills/` | `.vibe/skills/<name>/SKILL.md` with YAML frontmatter; project discovery requires trust |
| Command | https://docs.mistral.ai/vibe/code/cli/skills | Skills default to `user-invocable: true` and are invoked with `/skill-name`; supports `disable-model-invocation` | Reuse the Skill directory; do not create an undocumented `.vibe/commands/` directory |
| Sub-agent | https://docs.mistral.ai/vibe/code/cli/agents | Project `.vibe/agents/<name>.toml`; `agent_type = "subagent"` and `description`; `system_prompt_id` can reference `.vibe/prompts/<id>.md` | Generate TOML with inline instructions; this installer rejects external prompt dependencies rather than copying incomplete agents. A regular `agent_type = "agent"` definition is not a delegation-only subagent |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://docs.mistral.ai/vibe/code/cli/configuration ; https://docs.mistral.ai/vibe/code/cli/configuration-reference | `~/.vibe/config.toml` → `[[mcp_servers]]`. Respect `VIBE_HOME` or fail explicitly; serialize native arrays of tables. The installer supports stdio with environment, not remote transport. |
| Prompt | ✅ | https://docs.mistral.ai/vibe/code/cli/agents | `~/.vibe/AGENTS.md`, or `$VIBE_HOME/AGENTS.md`; user-level instructions. |
| Skill | ✅ | https://docs.mistral.ai/vibe/code/cli/skills | `~/.vibe/skills/<name>/SKILL.md`, under `VIBE_HOME` when set. |
| Sub-agent | ✅ | https://docs.mistral.ai/vibe/code/cli/agents | `~/.vibe/agents/<name>.toml`, under `VIBE_HOME` when set; generate `agent_type = "subagent"` with inline instructions. External prompt dependencies are not installed automatically. |
| Command | ↪ | https://docs.mistral.ai/vibe/code/cli/ | Skill-backed invocation does not establish a separate Command target. |

### Claude Desktop (global only)

Host ID: `claude-desktop`

Homepage: https://claude.com/download/

No project installation target is selected. Use `--global`; there is no automatic scope fallback.

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://modelcontextprotocol.io/docs/develop/connect-local-servers ; https://claude.com/download/ | macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`; Windows: `%APPDATA%\Claude\claude_desktop_config.json`; key `mcpServers`. Local stdio contract only; preserve unrelated settings. No verified Linux target selected: fail explicitly there. |
| Prompt / Skill | — | https://support.claude.com/en/articles/12512180-using-skills-in-claude | No automatic on-disk user installation contract selected. Uploaded skills are not a drop-in directory target. |
| Command / Sub-agent | — | — | No standalone file contract selected. Claude Code's `.claude/commands/` and `.claude/agents/` do not apply to Desktop. |

### Cline

Host ID: `cline`

Scope: the current [configuration layout](https://docs.cline.bot/getting-started/config) consolidates project directories. MCP still needs a CLI vs IDE distinction.

#### Project scope

| Asset Type | Official Source | Verified Contract / Open Question |
|------------|-----------------|-----------------------------------|
| MCP | https://docs.cline.bot/mcp/mcp-overview | No verified project-level automatic-discovery target selected; unsupported |
| Prompt | https://docs.cline.bot/customization/cline-rules | `.cline/rules/` or `.clinerules/`; also supports project `AGENTS.md`. The selected host-specific target is `.cline/rules/<name>.md` |
| Skill | https://docs.cline.bot/customization/skills | `.cline/skills/<name>/SKILL.md`; compatible with `.clinerules/skills/` and `.agents/skills/`. |
| Command | https://docs.cline.bot/core-workflows/using-commands ; https://docs.cline.bot/getting-started/config | Enabled skills can be invoked with slash commands. `.cline/workflows/` is also confirmed, but the standalone workflow schema needs further evidence. Use the Skill contract for now rather than infer a command-file format |
| Sub-agent | https://docs.cline.bot/features/subagents ; https://docs.cline.bot/getting-started/config | CLI/Desktop support subagents; IDE extensions do not. The configuration layout lists `.cline/agents/`, but the cited pages do not define the entry format or required fields. Do not infer `.md` drop-in support before verifying the exact contract |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://docs.cline.bot/mcp/mcp-overview ; https://docs.cline.bot/cli/cli-reference | **CLI:** `~/.cline/data/settings/cline_mcp_settings.json` → `mcpServers`; honor `CLINE_DIR`, `CLINE_DATA_DIR`, and the more specific `CLINE_MCP_SETTINGS_PATH`. Do not claim IDE-extension private settings support. |
| Prompt | ✅ | https://docs.cline.bot/customization/cline-rules ; https://docs.cline.bot/getting-started/config | `~/.cline/rules/<name>.md`. `CLINE_DIR` relocates the root; honor it or report unsupported configuration. |
| Skill | ✅ | https://docs.cline.bot/customization/skills | `~/.cline/skills/<name>/SKILL.md`; copy the whole bundle and apply the same root-override handling. |
| Command | ↪ | https://docs.cline.bot/core-workflows/using-commands | Skills are slash-invokable; no independent workflow format selected. |
| Sub-agent | ? | https://docs.cline.bot/features/subagents ; https://docs.cline.bot/getting-started/config | CLI/Desktop support subagents, but the standalone user entry format/required fields are unverified. The agents directory alone is insufficient. |

### Amp

Host ID: `amp`

Scope: **Amp CLI** configuration, not hosted MCP definitions stored by ampcode.com or arbitrary editor settings.

#### Project scope

| Asset Type | Official Source | Verified Contract / Open Question |
|------------|-----------------|-----------------------------------|
| MCP | https://ampcode.com/docs/cli/settings ; https://ampcode.com/docs/customize/mcp | Project `.amp/settings.json` / `.jsonc`; **literal key** `"amp.mcpServers"`, not a nested `amp` object; supports command/args/env or url/headers |
| Prompt | https://ampcode.com/docs/customize/agents-md | `AGENTS.md` in cwd, parent directories, and subtrees; selected target: project-root `AGENTS.md` |
| Skill | https://ampcode.com/docs/customize/skills | Project `.agents/skills/` |
| Command | — | No standalone command-file discovery contract verified; do not guess `.amp/commands/` |
| Sub-agent | — | Built-in delegation does not establish a standalone asset-file contract; custom sub-agent installation format remains unverified |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ✅ | https://ampcode.com/docs/cli/settings ; https://ampcode.com/docs/customize/mcp | `~/.config/amp/settings.json` / `settings.jsonc`; Windows uses `%USERPROFILE%/.config/amp/`. Literal `amp.mcpServers`, not nested objects. Preserve JSONC and command/args/env or url/headers. |
| Prompt | ✅ | https://ampcode.com/docs/customize/agents-md | `$HOME/.config/amp/AGENTS.md`; user-level instructions, distinct from system-wide managed guidance. |
| Skill | ✅ | https://ampcode.com/docs/customize/skills | `~/.config/amp/skills/<name>/SKILL.md`; this host-specific target avoids changing the shared agent-agnostic skill root. |
| Command / Sub-agent | — | — | No independent user file contract selected. |

### Continue

Host ID: `continue`

#### Project scope

| Asset Type | Official Source | Verified Contract / Open Question |
|------------|-----------------|-----------------------------------|
| MCP | https://docs.continue.dev/customize/deep-dives/mcp | Project `.continue/mcpServers/` accepts standalone YAML blocks (requiring name/version/schema) or compatible JSON MCP configs (key `mcpServers`); the main `config.yaml` uses an `mcpServers` list, not the same JSON map |
| Prompt | https://docs.continue.dev/customize/deep-dives/rules | `.continue/rules/<name>.md`; Markdown with YAML frontmatter is recommended; config YAML rules are also supported. The adapter selects Markdown rules |
| Skill | — | This audit has not verified a Continue-client automatic-discovery contract for `SKILL.md`; publishing skills for other agents does not establish that Continue itself reads them |
| Command | https://docs.continue.dev/customize/deep-dives/prompts | Markdown with `invokable: true` exposes a slash prompt; `prompts` in `config.yaml` can also reference Hub blocks. The local discovery/registration mechanism needs further clarification; do not infer `.continue/commands/` |
| Sub-agent | — | No standalone custom sub-agent file installation contract verified; checks run through an external coding agent's skill do not establish a Sub-agent asset contract for the Continue host |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP / Prompt / Skill / Command / Sub-agent | ? | https://docs.continue.dev/customize/deep-dives/mcp ; https://docs.continue.dev/customize/deep-dives/rules | No user-level target selected. Main YAML config, Hub blocks and project directory discovery are distinct protocols; do not infer a global path or JSON map schema. |

### Zed Agent

Host ID: `zed`

Scope: the native **Zed Agent**, not every external ACP agent or terminal thread opened inside Zed. Sources: https://zed.dev/docs/ai/mcp.md ; https://zed.dev/docs/ai/instructions.md ; https://zed.dev/docs/ai/skills.md ; https://zed.dev/docs/reference/all-settings.md .

#### Project scope

| Asset Type | Verified Contract / Installation Target |
|------------|-------------------------------------|
| MCP | No verified project-level MCP target selected; unsupported. |
| Prompt | Project instructions use the **first matching** file in this order: `.rules`, `.cursorrules`, `.windsurfrules`, `.clinerules`, `.github/copilot-instructions.md`, `AGENT.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Append to the effective file; use `AGENTS.md` when none exists. Writing a lower-priority file does not guarantee loading. |
| Skill | Project `.agents/skills/<name>/SKILL.md` |
| Command | Skills can be invoked by slash command; there is no separately verified drop-in command-file format. Reuse Skill installation. |
| Sub-agent | External agents, profiles and delegation do not establish a standalone Sub-agent asset format. No automatic file target verified here. |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ? | https://zed.dev/docs/ai/mcp.md | User `context_servers` settings exist, but native conversion/platform paths are not selected by this adapter. |
| Prompt | ✅ | https://zed.dev/docs/ai/instructions.md | macOS/Linux: `~/.config/zed/AGENTS.md`; personal instructions for the native Zed Agent, not every external ACP agent. Project first-match filenames do not redirect this write. Windows instruction path is not selected. |
| Skill | ✅ | https://zed.dev/docs/ai/skills.md | `~/.agents/skills/<name>/SKILL.md`; named skill directories must be direct children of the root. |
| Command | ↪ | https://zed.dev/docs/ai/skills.md | Skill invocation is not an independent user Command asset. |
| Sub-agent | — | — | No standalone user agent-file contract verified. |

### Aider

Host ID: `aider`

Official sources: https://aider.chat/docs/usage/conventions.html ; https://aider.chat/docs/config/aider_conf.html .

#### Project scope

| Asset Type | Verified Contract / Installation Target |
|------------|-------------------------------------|
| Prompt | The official example uses project-root `CONVENTIONS.md`, loaded read-only through `read` in `.aider.conf.yml`. `read` may be a scalar filename or an array. Append marker-delimited instructions to `CONVENTIONS.md` **and** register it, preserving existing read files, YAML comments and unrelated options. A copied Markdown file alone is not an always-loaded configuration. |
| MCP / Skill / Command / Sub-agent | No native standalone installation protocol verified in these sources. Aider's built-in `/read` command, third-party MCP wrappers, and arbitrary files added to a chat are not independent installable asset types. Reject these operations with an explicit reason rather than inventing directories. |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| Prompt | ? | https://aider.chat/docs/usage/conventions.html ; https://aider.chat/docs/config/aider_conf.html | No user conventions-file target and `read` registration selected. A user config file alone does not establish where to store/load the instruction asset. |
| MCP / Skill / Command / Sub-agent | — | https://aider.chat/docs/usage/conventions.html | No native standalone user installation protocol verified; built-in commands and wrappers are not installable assets. |

### goose

Host ID: `goose`

Scope: current goose CLI/Desktop file contracts. The original `block/goose` repository now redirects to `aaif-goose/goose`; the official site is https://goose-docs.ai/ . Sources: https://goose-docs.ai/docs/guides/config-files/ ; https://github.com/aaif-goose/goose/blob/main/documentation/docs/guides/context-engineering/using-goosehints.md ; https://github.com/aaif-goose/goose/blob/main/documentation/docs/guides/context-engineering/using-skills.md .

#### Project scope

| Asset Type | Verified Contract / Installation Target |
|------------|-------------------------------------|
| MCP | No verified project-level MCP target selected; unsupported. |
| Prompt | Default project context filenames are `AGENTS.md` and `.goosehints`. The adapter appends to project `AGENTS.md`; non-default context filename overrides are outside this adapter contract. |
| Skill | Project `.agents/skills/<name>/SKILL.md`; a user-disabled extension is not bypassed by writing files. |
| Command | Skills are loadable through `/skills`; recipes/custom slash commands are separate mechanisms. No independent Markdown command target selected by this adapter. |
| Sub-agent | Custom agents and recipes need their own format/registration verification; do not infer a `.goose/agents/` drop-in directory from delegation support. |

#### User scope (`--global`)

| Asset Type | Status | Official Source | Native Target / Constraints |
|------------|--------|-----------------|-----------------------------|
| MCP | ? | https://goose-docs.ai/docs/guides/config-files/ | User `~/.config/goose/config.yaml` uses extensions, not a portable `mcpServers` map; no native converter selected. |
| Prompt | ✅ | https://github.com/aaif-goose/goose/blob/main/documentation/docs/guides/context-engineering/using-goosehints.md | macOS/Linux: `~/.config/goose/.goosehints`; global hints. Windows target is not selected. |
| Skill | ✅ | https://github.com/aaif-goose/goose/blob/main/documentation/docs/guides/context-engineering/using-skills.md | `~/.agents/skills/<name>/SKILL.md`; preserve the entire bundle. |
| Command | ↪ | https://goose-docs.ai/docs/guides/config-files/ | `/skills` invocation, recipes and custom slash commands do not establish an independent Markdown Command target. |
| Sub-agent | — | — | No standalone user agent-file contract verified. |

---

## Serialization and Safety Boundaries

These constraints apply to the selected scope. Format compatibility does not imply identical project and user paths.

| Area | Behavior | Boundary |
|------|----------------------|----------|
| MCP conversion | opencode/Kilo native local/remote schema; Codex HTTP and stdio TOML; Vibe stdio with environment; VS Code `servers`; Amp literal `amp.mcpServers` | Unsupported fields/transports fail explicitly. Remote Vibe transport is unsupported. Existing JSONC comments and unrelated settings are preserved. Native TOML table additions preserve existing text; inline TOML representations may require serialization and normalize comments/formatting. |
| Native MCP fields | Validate opencode/Kilo booleans, positive integer millisecond timeouts and strict OAuth objects; Codex booleans, paths, string-valued headers, environment/tool lists, per-tool settings and finite nonnegative second timeouts before writing | Preserve `false`, empty lists/maps and valid zero/fractional Codex timeouts without coercion. Kilo OAuth supports `clientId`, `clientSecret` and `scope`; its strict OAuth object and positive integer millisecond timeouts are defined in the [official Kilo schema at commit `6f08110`](https://github.com/Kilo-Org/kilo/blob/6f08110d4dcc36200c084a7b4134ec040cedfd61/packages/opencode/src/config/config.ts#L609-L667). [opencode's schema](https://opencode.ai/config.json) additionally supports `callbackPort` (1–65535) and `redirectUri`. Invalid fields fail preflight without writing any asset. |
| Other native MCP options | Validate documented Gemini/Qwen working directories, trust, timeout, tool lists and OAuth field types; Roo disabled/tool/watch-path options and 1–3600 second timeouts; Kiro disabled/tool lists | These are checks of verified optional fields, not exhaustive native-host schema validation. Other unverified extension fields are not interpreted. opencode/Kilo, Codex, Vibe, Gemini/Qwen, VS Code and Roo consume portable transport selectors; Roo uses native `streamable-http` rather than `http`. |
| Prompt registration | Kilo writes a rule and registers `instructions`; Aider writes `CONVENTIONS.md` and merges YAML `read` | No interactive UI registration is attempted. A registration error is checked before writing prompt content; multi-file writes are not a filesystem transaction. |
| Prompt selection | Zed respects first-match precedence; Gemini respects project `context.fileName` | Configured Gemini filenames stay inside the selected scope; user prompt selection uses user settings, not project overrides. |
| Native assets | Codex and Vibe subagents use valid TOML; Gemini and Tabnine commands use TOML; Codex skills use `.agents/skills`; skill directories retain supporting resources | Codex unsupported metadata and Vibe reserved `main` are rejected rather than silently discarded. |
| Content and collision handling | Native serialization, BOM/CRLF frontmatter, host override precedence, semantic MCP comparison, changed standalone-rule conflicts and same-batch non-Skill name-collision preflight | Different marker-delimited prompt content is updated. Different standalone content conflicts. Incoming non-Skill name collisions block the batch before writes; existing destination conflicts are not a transactional batch rollback. Skills retain entry-file-based existence behavior. All checks use only the selected scope. |
| Configuration safety | MCP names reject reserved structural keys (`__proto__`, `constructor`, `prototype`, `<<`) before batch writes; Claude Code remote entries normalize HTTP/SSE transport; atomic writes preserve file symlinks | Symlink chains resolve to their existing referent. Dangling or cyclic links fail explicitly without replacing the link. New files use `0600`; existing file permissions are retained. |
| MCP source shape | A flat single-server map is distinguished from a direct server definition by its object structure, not by reserving transport field names. | Names such as `command`, `url`, `serverUrl`, `httpUrl`, `type` and `transport` remain valid flat-map server names; direct scalar `httpUrl` is still a server definition. |
| Ambiguous configuration and remote endpoints | Reject duplicate decoded object keys in JSON and JSONC, including nested objects and objects in arrays; repeated names in different objects are valid. Reparse edits and check the effective value before writing. Validate HTTP(S) URL structure, hostname and port without connecting to the endpoint. | Preserve ambiguous files byte-for-byte rather than editing an ineffective duplicate section. Gemini/Qwen `${ENV_VAR}` URL placeholders are preserved and structurally checked using dummy substitution, without reading environment values. |
| Kimi | Subagents remain explicitly unsupported by this installer | Upstream YAML files require parent registration and `--agent-file` selection; this is not lack of product support. |
| Kiro | Current Markdown custom agents, steering and skills | Older CLI 2.x schemas are not migrated. Custom-agent `resources`/skill registration remains the user's responsibility; default-agent discovery does not imply custom-agent availability. |
| Windsurf | Historical project rules, skills and Cascade workflows only | Current redirects do not reverify historical MCP/Windows paths. Legacy rules/skills and Cascade workflows are not Devin Local. |
| Claude Desktop / OpenClaw | User targets only, as listed in each tool's table | Project-scope requests fail explicitly; neither host implies a project-path equivalent of its user configuration. |
| Copilot / Augment | VS Code compatibility MCP / Auggie CLI JSONC settings | These IDs do not establish portable Copilot harness or Augment IDE-extension configuration behavior. |

---

## New Host Candidates (Not Implemented)

These are **proposed future adapters**, not additions to the current registry. IDs below are provisional. Factory Droid and Google Antigravity remain candidates; the six Issue #7 hosts are registered above. This is not an exhaustive list of AI products.

| Candidate | Proposed ID | MCP | Prompt | Skill | Command | Sub-agent |
|-----------|-------------|-----|--------|-------|---------|-----------|
| Factory Droid | `droid` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Google Antigravity | `antigravity` | ✅ | ✅ | ✅ | ↪ (migration) | — |

`?` means the precise installable protocol is not yet verified. Do not implement those cells by guessing a conventional directory.

### Factory Droid (Candidate)

| Asset Type | Official Source | Verified Contract / Proposed Target |
|------------|-----------------|-------------------------------------|
| MCP | https://docs.factory.ai/harness/mcp | Project `.factory/mcp.json`; top-level `mcpServers`; project definitions win on name conflicts; preserve transport-specific type/command/url fields |
| Prompt | https://docs.factory.ai/harness/agents-md | `AGENTS.md` with project and subtree scope; a future target can use project-root `AGENTS.md` with marker-based appending, without overwriting existing team instructions |
| Skill | https://docs.factory.ai/harness/skills | Project `.factory/skills/<name>/SKILL.md`; directory bundle with YAML frontmatter (name, description) |
| Command | https://docs.factory.ai/harness/custom-slash-commands | Project `.factory/commands/<name>.md`; executable scripts are also supported. A future adapter must handle permissions/platform differences rather than merely change extensions |
| Sub-agent | https://docs.factory.ai/harness/subagents | Project `.factory/droids/<name>.md`; Markdown with YAML frontmatter; project definitions win on name conflicts; only the top level is scanned. Do not substitute `.factory/agents/` |



### Google Antigravity (Candidate)

Scope: MCP file paths below are explicitly documented for **CLI and IDE**. The App has an MCP management UI, but its automatic file-discovery contract is not established here; do not assume all surfaces discover the same files.

| Asset Type | Official Source | Verified Contract / Open Question |
|------------|-----------------|-----------------------------------|
| MCP | https://antigravity.google/docs/mcp/ | **CLI and IDE:** project `.agents/mcp_config.json`; top-level `mcpServers`. The CLI and IDE sections each state these paths; App file discovery remains unverified. Transport-specific fields must follow this product's schema |
| Prompt | https://antigravity.google/docs/rules/ | Project `AGENTS.md` / `GEMINI.md`, or `.agents/rules/*.md`; modular rules require valid YAML frontmatter and trigger metadata, and are ignored without it. Prefer explicitly selecting `AGENTS.md` for a future target rather than modular rules without frontmatter |
| Skill | https://antigravity.google/docs/skills/ | Project `.agents/skills/<name>/SKILL.md`; backward-compatible with `.agent/skills/`. Distinguish additional App / IDE / CLI discovery paths |
| Command | https://antigravity.google/docs/ide/workflows/ | The official notice says legacy Workflows stop working on **2026-10-19** and recommends migration to Agent skills. This audit is after that cutoff; do not list legacy `.agent/workflows/` as a usable target for a new adapter |
| Sub-agent | — | No standalone sub-agent file installation contract verified; multi-agent UI workflows are not an on-disk format |





Other clients (for example OpenHands and Pi) are **not declared unsupported** by their omission. Add a candidate only after verifying its exact file protocol, client surface and scope from official sources.

---

## How to Add a New Host (Contribution Guide)

1. **Documentation first:** verify official sources and add a candidate section with proposed ID, client/version scope, native project/user paths, config keys, schema, required metadata and unresolved questions. Keep candidates separate from the registered host sections and user-facing support tables.
2. In a separate implementation change, add the ID to `HostId` in `types.ts` and create `src/hosts/<id>.ts` implementing `HostAdapter`. Keep project `assets` and the user-scope `userAssets(environment)` factory together in that adapter; omit the factory when no user targets are selected. Register the adapter in `src/hosts/index.ts`. Shared scope selection must not contain per-host path switches.
3. Ensure each supported asset type has a valid `writeStrategy` **and format handling**: convert MCP schemas, preserve JSONC/TOML, copy full skill bundles, generate frontmatter and register dependent files where required. Keep native MCP conversion (`mcp`), sub-agent serialization (`serializeSubAgent`) and prompt discovery (`resolvePromptTarget`) in the host adapter; asset handlers must not branch on host IDs. Shared protocol helpers belong under `src/hosts/`. A config key alone is not a transport schema.
4. Do not force skills-as-commands, custom modes, uploaded ZIPs or parent-registered agents into independent Markdown asset directories. If the model cannot represent a contract yet, use `NOT_SUPPORTED(reason)` with a precise explanation and document the gap.
5. Add file-contract acceptance scenarios under `tests/features/host/` or `tests/features/complex/`, parse generated artifacts, and run them through the built CLI. Reserve unit tests for isolated utilities and metadata smoke checks. Cover client/version and OS differences; detection paths are hints, not proof of an installed client or supported capability.
6. Keep source links, verification date and known adapter gaps current. Never promote third-party path guesses or historical "not planned" issues above current official documentation.
