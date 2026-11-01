# Host Capability Matrix

This file is the **single source of truth for target host adapter configurations** in `agent-add`.
It records upstream file contracts, not a guarantee that the current CLI implements every entry.
Adapters in `src/hosts/<id>.ts` should converge on these contracts; known gaps are listed below.

**Last verified: 2026-11-01 (UTC).** Sources are official product documentation unless explicitly labeled otherwise.
Descriptions below are paraphrases, not verbatim quotations. Contracts were documented before the corresponding adapter changes.

### Scope and interpretation

- The first matrix covers the **24 registered adapters**. [New host candidates](#new-host-candidates-not-implemented) are separate: their proposed IDs are **not** accepted by `--host` yet.
- A capability means an installable **file contract**, not merely a similarly named UI feature or a built-in command. Skills that expose slash commands are not a second, independent command-file format.
- Relative paths are project-relative unless stated otherwise. `~` means the user's home directory, including on Windows; do not substitute `%APPDATA%` without upstream evidence. Respect documented config-home overrides and workspace trust.
- A Skill is a **directory bundle** with a `SKILL.md` entry point: preserve supporting scripts/resources, not just the entry file. Same-name discovery precedence is host-specific.
- Write strategies name installer operations, not upstream formats. JSONC/JSON5, TOML, nested keys, frontmatter and registration requirements must be handled explicitly; changing an extension or copying Markdown alone does not convert a format.
- This reference and the executable file-contract scenarios are **not runtime validation in all native hosts**. Unverified protocols remain unverified rather than being inferred from third-party host lists or old issues. A successful HTTP response or redirect is not proof: check the final page's product, client/version scope and actual file contract.

---

## Capability Matrix

> ✅ = documented file contract | ↪ = legacy, skill-backed, or requires registration (see details) | ? = historical contract not reverified | — = no standalone file contract verified
>
> These are upstream capabilities, **not current adapter implementation status**. CLI/IDE scope matters.

| Host | ID | MCP | Prompt | Skill | Command | Sub-agent |
|------|----|-----|--------|-------|---------|-----------|
| Cursor | `cursor` | ✅ | ✅ | ✅ | ↪ | ✅ |
| Claude Code | `claude-code` | ✅ | ✅ | ✅ | ↪ | ✅ |
| GitHub Copilot (VS Code) | `github-copilot` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gemini CLI | `gemini` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kilo Code | `kilo-code` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Qwen Code | `qwen-code` | ✅ | ✅ | ✅ | ✅ | ✅ |
| opencode | `opencode` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Augment / Auggie | `augment` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Windsurf / legacy Cascade | `windsurf` | ? (historical) | ↪ (legacy) | ↪ (legacy) | ↪ (Cascade only) | — |
| Roo Code | `roo-code` | ✅ | ✅ | ✅ | ✅ | — |
| Kiro (CLI V3 / IDE 1.0) | `kiro` | ✅ | ✅ | ✅ | ↪ | ✅ |
| Codex CLI | `codex` | ✅ (TOML) | ✅ | ✅ | ↪ (deprecated) | ✅ (TOML) |
| Tabnine (IDE Agent / CLI; see scope below) | `tabnine` | ✅ | ✅ | — | ✅ (TOML) | — |
| Kimi Code CLI | `kimi` | ✅ | ✅ | ✅ | ↪ | ↪ (YAML + registration) |
| Trae | `trae` | ✅ | ✅ | ✅ | — | — |
| OpenClaw | `openclaw` | ✅ (JSON5) | ✅ | ✅ | ↪ | — |
| Mistral Vibe | `vibe` | ✅ (TOML) | ✅ | ✅ | ↪ | ✅ (TOML) |
| Claude Desktop | `claude-desktop` | ✅ | — | ↪ (UI upload) | — | — |
| Zed Agent | `zed` | ✅ (JSONC) | ✅ | ✅ | ↪ (skills) | — |
| Cline (CLI MCP target) | `cline` | ✅ | ✅ | ✅ | ↪ (skills) | — |
| Continue | `continue` | ✅ | ✅ | ? | ↪ | — |
| Aider | `aider` | — | ↪ (read registration) | — | — | — |
| goose | `goose` | ✅ (YAML) | ✅ | ✅ | ↪ (skills) | — |
| Amp CLI | `amp` | ✅ (JSONC) | ✅ | ✅ | — | — |

## Implementation Status and Remaining Boundaries

The CLI now registers the six hosts in Issue #7. Supported file contracts are
validated through the built CLI in `tests/features/complex/host-contracts.feature`;
this does not claim native application or live MCP-server validation.

| Area | Implemented behavior | Boundary |
|------|----------------------|----------|
| MCP conversion | opencode/Kilo native local/remote schema; Codex HTTP and stdio TOML; Vibe stdio with environment; VS Code `servers`; Cline streamable HTTP; Goose YAML extensions; Zed `context_servers`; Amp literal `amp.mcpServers`; OpenClaw JSON5 `mcp.servers` | Unsupported fields/transports fail explicitly. Remote Vibe transport is not implemented. Existing JSONC/JSON5/YAML comments and unrelated settings are preserved. Native TOML table additions preserve existing text; inline TOML representations may require serialization and normalize comments/formatting. |
| Prompt registration | Kilo writes a rule and registers `instructions`; Aider writes `CONVENTIONS.md` and merges YAML `read` | No interactive UI registration is attempted. A registration error is checked before writing prompt content; multi-file writes are not a filesystem transaction. |
| Prompt selection | Zed respects first-match precedence; OpenClaw selects its configured default workspace; Gemini respects project `context.fileName`; Goose respects `CONTEXT_FILE_NAMES` | CLI-selected project targets, not automatic migration of every user/client configuration. |
| Native assets | Codex and Vibe subagents use valid TOML; Gemini and Tabnine commands use TOML; Codex skills use `.agents/skills`; skill directories retain supporting resources | Codex unsupported metadata and Vibe reserved `main` are rejected rather than silently discarded. |
| Audit regressions F01–F08 | Native serialization, BOM/CRLF frontmatter, host override precedence, semantic MCP comparison, changed standalone-rule conflicts, same-batch non-Skill name-collision preflight | Different marker-delimited prompt content is updated. Different standalone content conflicts. Incoming non-Skill name collisions block the batch before writes; existing destination conflicts are not a transactional batch rollback. Skills retain entry-file-based existence behavior. |
| Kimi | Subagents remain explicitly unsupported by this installer | Upstream YAML files require parent registration and `--agent-file` selection; this is not lack of product support. |
| Kiro | Current Markdown custom agents, steering and skills | Older CLI 2.x schemas are not migrated. Custom-agent `resources`/skill registration remains the user's responsibility; default-agent discovery does not imply custom-agent availability. |
| Windsurf | Historical adapter retained without changing its paths | Current redirects do not reverify historical MCP/Windows paths. Legacy rules/skills and Cascade workflows are not Devin Local. |
| Claude Desktop | File-based MCP only | Skill ZIP upload requires the UI; it is not directory discovery. |
| Copilot / Augment | VS Code compatibility MCP / Auggie CLI JSONC settings | These IDs do not establish portable Copilot harness or Augment IDE-extension configuration behavior. |
| New host limits | Zed/Cline/Goose/Amp support MCP, Prompt and Skill; Continue supports MCP and Prompt; Aider supports registered Prompt | No new independent Command/Sub-agent format is invented. Continue uses `.continue/mcpServers/agent-add.json`; Goose new extensions default to `enabled: true` and `timeout: 300`. |


---

## Host Configuration Details

### Cursor

Homepage: https://cursor.com/docs

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://cursor.com/docs/context/mcp | Project `.cursor/mcp.json`; global `~/.cursor/mcp.json`; key `mcpServers` | `.cursor/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://cursor.com/docs/context/rules | Native rules use `.cursor/rules/*.mdc`; `AGENTS.md` is also supported as a cross-tool standard | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://cursor.com/docs/skills | Project `.cursor/skills/` and `.agents/skills/`; corresponding home directories for personal skills; each bundle contains `SKILL.md` | Keep `.cursor/skills/<name>/SKILL.md` as the host-specific target; copy the directory bundle |
| Command | https://cursor.com/changelog/1-6 ; https://cursor.com/docs/skills | The v1.6 `.cursor/commands/<name>.md` contract is legacy; current docs recommend `/migrate-to-skills` to migrate commands to skills | Mark as legacy; prefer `.cursor/skills/<name>/SKILL.md` for new reusable workflows. A redirect to the skills page is not current evidence for the old command path |
| Sub-agent | https://cursor.com/docs/subagents | Project `.cursor/agents/` or user `~/.cursor/agents/`; Markdown format | `.cursor/agents/<name>.md` (strategy: `copy-file`) |

### Claude Code

Homepage: https://code.claude.com/docs/en

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://code.claude.com/docs/en/mcp | Shared project `.mcp.json`, key `mcpServers`; user `~/.claude.json`; HTTP servers require `type: "http"` | `.mcp.json` → key `mcpServers`; do not omit the remote transport type or overwrite existing user configuration |
| Prompt | https://code.claude.com/docs/en/memory | `./CLAUDE.md` or `./.claude/CLAUDE.md`; user `~/.claude/CLAUDE.md` | `CLAUDE.md` in project root (strategy: `append-with-marker`) |
| Skill | https://code.claude.com/docs/en/skills | Project `.claude/skills/<skill-name>/SKILL.md` or personal `~/.claude/skills/` | `.claude/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://code.claude.com/docs/en/skills | Commands have merged into skills; `.claude/commands/` remains backward-compatible | Existing `.claude/commands/<name>.md` files remain usable; prefer `.claude/skills/<name>/SKILL.md` for new workflows |
| Sub-agent | https://code.claude.com/docs/en/sub-agents | Project `.claude/agents/` or user `~/.claude/agents/`; Markdown with YAML frontmatter | `.claude/agents/<name>.md` (strategy: `copy-file`) |

### GitHub Copilot

Homepage: https://docs.github.com/en/copilot

Scope: the adapter's MCP target is **VS Code**, not a universal Copilot CLI/cloud configuration. Copilot CLI uses [user `~/.copilot/mcp-config.json` or project `.mcp.json` / `.github/mcp.json`](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers), with key `mcpServers`; do not write `.vscode/mcp.json` and claim CLI support.

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://code.visualstudio.com/docs/agent-customization/mcp-servers | VS Code workspace `.vscode/mcp.json` or user-profile `mcp.json`; key `servers`. These remain available for compatibility and are labeled deprecated in the guided flow | Preserve `servers` for the existing VS Code target. Portable project `.mcp.json` / user `~/.copilot/mcp-config.json` use `mcpServers`; interactive-input servers are not forwarded to Copilot harness sessions. Select the destination and harness explicitly; do not merely rename the key |
| Prompt | https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot | `.github/copilot-instructions.md`; also supports `.github/instructions/*.instructions.md` and `AGENTS.md` | `.github/copilot-instructions.md` (strategy: `append-with-marker`) |
| Skill | https://docs.github.com/en/copilot/concepts/agents/about-agent-skills | Project `.github/skills/`, `.claude/skills/`, `.agents/skills/`; personal `~/.copilot/skills/`, `~/.agents/skills/` | `.github/skills/<name>/SKILL.md` requires frontmatter (name, description) and the complete directory bundle |
| Command | https://docs.github.com/en/copilot/tutorials/customization-library/prompt-files/your-first-prompt-file | `.github/prompts/<name>.prompt.md`; YAML frontmatter; invoked with `/<name>` | `.github/prompts/<name>.prompt.md` (strategy: `copy-file`) |
| Sub-agent | https://code.visualstudio.com/docs/copilot/customization/custom-agents | VS Code project `.github/agents/`, also `.claude/agents/`; user `~/.copilot/agents/`; Markdown with YAML frontmatter | `.github/agents/<name>.agent.md`; follow the VS Code schema rather than substituting cloud-agent field constraints |

### Gemini CLI

Homepage: https://geminicli.com/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://geminicli.com/docs/tools/mcp-server/ | User `~/.gemini/settings.json` or project `.gemini/settings.json`; key `mcpServers` | `.gemini/settings.json` → key `mcpServers`; preserve transport-specific fields for stdio / SSE / HTTP rather than changing only the top-level key |
| Prompt | https://geminicli.com/docs/cli/gemini-md/ | Defaults to user `~/.gemini/GEMINI.md` and project-hierarchy `GEMINI.md` files; `context.fileName` can specify another name or a list of names, such as `AGENTS.md` | Default target: `GEMINI.md`; respect the user's configured context filenames instead of claiming the default file is always loaded |
| Skill | https://geminicli.com/docs/cli/skills/ | Project `.gemini/skills/` or `.agents/skills/`; corresponding home directories for user skills | Within the same scope, `.agents/skills/` takes precedence over `.gemini/skills/`; `.gemini/skills/<name>/SKILL.md` remains a valid host-specific target |
| Command | https://geminicli.com/docs/cli/custom-commands/ | User or project `.gemini/commands/`; TOML with required `prompt` and optional `description` | `.gemini/commands/<name>.toml`; serialize TOML rather than renaming Markdown; reload with `/commands reload` |
| Sub-agent | https://geminicli.com/docs/core/subagents/ | Project `.gemini/agents/*.md` or user `~/.gemini/agents/*.md`; Markdown with YAML frontmatter | `.gemini/agents/<name>.md` (strategy: `copy-file`) |

### Kilo Code

Homepage: https://kilo.ai/docs

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://kilo.ai/docs/automate/mcp/using-in-kilo-code | Project `kilo.jsonc` / `.kilo/kilo.jsonc` (also supports `.json`); user `~/.config/kilo/kilo.jsonc`; top-level `mcp` | Local: `{type: "local", command: [exe, ...args], environment: {...}}`; remote: `{type: "remote", url: ...}`; requires JSONC-aware merging and schema conversion |
| Prompt | https://kilo.ai/docs/customize/custom-rules | Reference `.kilo/rules/<name>.md` through file paths or globs in `kilo.jsonc`'s `instructions`; legacy `.kilocode/rules/` is automatically compatible | New installations must write the rule file **and** register it in `instructions`; creating the new directory alone is insufficient |
| Skill | https://kilo.ai/docs/customize/skills | Project `.kilo/skills/`; user `~/.kilo/skills/`; also reads `~/.agents/skills/` | `.kilo/skills/<name>/SKILL.md`; YAML frontmatter (name, description); do not retain old directories unverified by current docs |
| Command | https://kilo.ai/docs/customize/workflows | Project `.kilo/commands/`; user `~/.config/kilo/commands/`; legacy `.kilocode/workflows/` is migrated automatically | `.kilo/commands/<name>.md`, not `.kilocode/commands/` |
| Sub-agent | https://kilo.ai/docs/customize/custom-subagents | Project `.kilo/agents/`; user `~/.config/kilo/agents/`; Markdown with YAML frontmatter | `.kilo/agents/<name>.md`; agents can also be defined under `agent` in `kilo.jsonc` |

### Qwen Code

Homepage: https://qwenlm.github.io/qwen-code-docs/en/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/ | `.qwen/settings.json`; key `mcpServers` | `.qwen/settings.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://qwenlm.github.io/qwen-code-docs/en/blog/updates/weekly-update-2026-03-06/ | The official update confirms automatic loading of project-root `AGENTS.md`; do not promise a fixed conflict precedence against `QWEN.md` without evidence | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/ | Project `.qwen/skills/<skill-name>/SKILL.md`; personal `~/.qwen/skills/` | `.qwen/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.qwen/skills`) |
| Command | https://qwenlm.github.io/qwen-code-docs/en/users/features/commands/ | Custom Commands section: project `.qwen/commands/`; user `~/.qwen/commands/`; Markdown with optional YAML frontmatter; legacy TOML is deprecated | `.qwen/commands/<name>.md`; project definitions win on name conflicts; subdirectories become colon-separated namespaces |
| Sub-agent | https://qwenlm.github.io/qwen-code-docs/en/users/features/sub-agents/ | Project `.qwen/agents/`; user `~/.qwen/agents/`; Markdown with YAML frontmatter | `.qwen/agents/<name>.md` (strategy: `copy-file`, installDir: `.qwen/agents`) |

### opencode

Homepage: https://opencode.ai/docs

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://opencode.ai/docs/mcp-servers/ ; https://opencode.ai/docs/config/ | Project `opencode.json` / `opencode.jsonc`; user `~/.config/opencode/opencode.json`; top-level `mcp`. The config reference documents global/project paths and precedence | Local servers use `type: "local"`, `command: [exe, ...args]`, and `environment`; remote servers use `type: "remote"` and `url`. Do not copy server objects directly from `mcpServers` |
| Prompt | https://opencode.ai/docs/rules | Project-root `AGENTS.md`; global `~/.config/opencode/AGENTS.md`; also supports a `CLAUDE.md` fallback | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://opencode.ai/docs/skills | Project `.opencode/skills/<name>/SKILL.md`; global `~/.config/opencode/skills/` | `.opencode/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.opencode/skills`) |
| Command | https://opencode.ai/docs/commands | Project `.opencode/commands/`; global `~/.config/opencode/commands/`; Markdown with YAML frontmatter | `.opencode/commands/<name>.md` (strategy: `copy-file`, installDir: `.opencode/commands`) |
| Sub-agent | https://opencode.ai/docs/agents | Project `.opencode/agents/` or global `~/.config/opencode/agents/`; Markdown with YAML frontmatter | `.opencode/agents/<name>.md` (strategy: `copy-file`, installDir: `.opencode/agents`) |

### Augment

Homepage: https://docs.augmentcode.com/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.augmentcode.com/cli/integrations ; https://docs.augmentcode.com/cli/settings | **Auggie CLI** user `~/.augment/settings.json`; project `.augment/settings.json`; local override `.augment/settings.local.json`; key `mcpServers` | The settings reference explicitly supports JSONC, including comments and trailing commas. For the IDE extension's settings panel / Import from JSON, see https://docs.augmentcode.com/setup-augment/mcp ; do not assume it shares the CLI file |
| Prompt | https://docs.augmentcode.com/setup-augment/guidelines | User `~/.augment/rules/`; workspace `.augment/rules/`; also supports `AGENTS.md`/`CLAUDE.md` | `.augment/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.augment/rules`) |
| Skill | https://docs.augmentcode.com/using-augment/skills | Project `.augment/skills/`; user `~/.augment/skills/`; compatible with `.agents/skills/` and `.claude/skills/` | `.augment/skills/<name>/SKILL.md`; copy the directory bundle and respect host discovery precedence |
| Command | https://docs.augmentcode.com/using-augment/custom-commands | User `~/.augment/commands/`; workspace `.augment/commands/<name>.md` | `.augment/commands/<name>.md` (strategy: `copy-file`, installDir: `.augment/commands`) |
| Sub-agent | https://docs.augmentcode.com/cli/subagents | User `~/.augment/agents/`; workspace `.augment/agents/`; Markdown with YAML frontmatter | `.augment/agents/<name>.md` (strategy: `copy-file`, installDir: `.augment/agents`) |

### Windsurf

Official legacy reference: https://docs.devin.ai/desktop/cascade

Scope: the registered `windsurf` ID refers to legacy Windsurf/Cascade, **not Devin Local**. Former Windsurf documentation URLs now redirect to Devin documentation. Current Devin Desktop no longer starts or reopens Cascade conversations; the workflow contracts below are historical, not new Devin Local capabilities. Current documentation retains some `.windsurf/` project directories for compatibility, but that does not verify every historical user directory or MCP path.

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.devin.ai/desktop/devin-local/customizations#mcp-servers | Historical Windsurf/Cascade path: `~/.codeium/windsurf/mcp_config.json` → `mcpServers`, **not reverified**. The former MCP source now redirects to this Devin Local page, which does not document that file | No current Windsurf MCP target verified here. Devin Local uses project `.devin/config.json`, local `.devin/config.local.json`, or user `~/.config/devin/config.json`; these are a different host contract, not replacement paths for `windsurf` |
| Prompt | https://docs.devin.ai/desktop/devin-local/customizations#rules | `.windsurf/rules/*.md` is a legacy compatibility directory; current documentation prefers `.devin/rules/*.md` | `.windsurf/rules/<name>.md` is a legacy target (strategy: `create-file-in-dir`); keep client/version scope explicit rather than presenting it as the preferred current directory |
| Skill | https://docs.devin.ai/desktop/devin-local/customizations#skills | Project `.windsurf/skills/` is read for legacy compatibility; current Devin Local prefers `.devin/skills/` and user `~/.config/devin/skills/`. Bundles contain `SKILL.md` with name/description frontmatter | `.windsurf/skills/<name>/SKILL.md` is a legacy project target. Historical user `~/.codeium/windsurf/skills/` remains unverified by the current source; do not advertise it as a verified current global target |
| Command | https://docs.devin.ai/desktop/cascade#workflows | Cascade-only workflows: preferred `.devin/workflows/*.md`, legacy `.windsurf/workflows/*.md` fallback. **Devin Local does not support workflows** | `.windsurf/workflows/<name>.md` is a historical Cascade target, not a Devin Local command directory. Migrate workflows to skills for Devin Local |
| Sub-agent | — | No standalone sub-agent file installation contract verified | Do not infer automatic discovery in `.windsurf/agents/` from built-in parallelism |

### Roo Code

Homepage: https://docs.roocode.com/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.roocode.com/features/mcp/using-mcp-in-roo | Project `.roo/mcp.json`; key `mcpServers` | `.roo/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.roocode.com/features/custom-instructions | `.roo/rules/` is loaded recursively in filename order; also supports `.roo/rules-{modeSlug}/` | `.roo/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.roo/rules`) |
| Skill | https://docs.roocode.com/features/skills | Project `.roo/skills/`; user `~/.roo/skills/`; also reads `.agents/skills/`; supports mode-specific `.roo/skills-{modeSlug}/` | `.roo/skills/<name>/SKILL.md` requires name and description in frontmatter; copy the complete directory bundle |
| Command | https://docs.roocode.com/features/slash-commands | `.roo/commands/`; filenames define command names, e.g. `review.md` → `/review` | `.roo/commands/<name>.md` (strategy: `copy-file`, installDir: `.roo/commands`) |
| Sub-agent | https://docs.roocode.com/features/custom-modes | Custom modes use `.roomodes` / `custom_modes.yaml`, not standalone drop-in sub-agent Markdown files | This audit does not equate mode configuration with a Sub-agent asset; do not create an unverified `.roo/agents/` directory |

### Kiro

Homepage: https://kiro.dev/docs/

Scope: current docs cover **IDE 1.0 / CLI V3**. CLI 2.x JSON agent settings have migration differences; do not treat all Kiro versions as interchangeable.

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://kiro.dev/docs/mcp/configuration/ | Workspace `.kiro/settings/mcp.json`; user `~/.kiro/settings/mcp.json`; key `mcpServers` | `.kiro/settings/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://kiro.dev/docs/steering/ | Project `.kiro/steering/`; user `~/.kiro/steering/`; also loads `AGENTS.md`; supports inclusion frontmatter | `.kiro/steering/<name>.md`; custom agents must explicitly include steering in `resources`, e.g. `file://.kiro/steering/**/*.md` |
| Skill | https://kiro.dev/docs/skills/ | `.kiro/skills/<name>/SKILL.md` or `~/.kiro/skills/` | The default agent discovers skills automatically; custom agents need `skill://` URIs in `resources`. Copying files alone does not guarantee availability |
| Command | https://kiro.dev/docs/skills/ ; https://kiro.dev/docs/steering/ | Skills and manual/auto steering can be invoked as slash commands | Reuse the Skill/Prompt contracts; no independent `.kiro/commands/` directory verified |
| Sub-agent | https://kiro.dev/docs/custom-agents/configuration-reference/ ; https://kiro.dev/docs/custom-agents/subagents/ | Workspace `.kiro/agents/` or user `~/.kiro/agents/`; the current format supports Markdown frontmatter and a prompt body | `.kiro/agents/<name>.md`; document version and `resources`/`includeMcpJson` behavior; migrate legacy JSON with `/upgrade-agent` |

### Codex CLI

Homepage: https://github.com/openai/codex

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://developers.openai.com/codex/mcp | Global `~/.codex/config.toml`; project `.codex/config.toml`; TOML tables `[mcp_servers.<server-name>]` | macOS/Linux: `~/.codex/config.toml` (TOML table format: `[mcp_servers.<name>]`); Windows: `%USERPROFILE%\.codex\config.toml` |
| Prompt | https://developers.openai.com/codex/guides/agents-md | `AGENTS.md` at the repository root and in subdirectories; global `~/.codex/AGENTS.md` | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://developers.openai.com/codex/skills | Searches `.agents/skills/` at each project level from cwd to the repository root; user `$HOME/.agents/skills/`; admin `/etc/codex/skills/` | `.agents/skills/<name>/SKILL.md`; `.codex/skills/` is no longer the current officially recommended path; include name/description frontmatter |
| Command | https://developers.openai.com/codex/custom-prompts | Deprecated custom prompts use `~/.codex/prompts/*.md` and are not shared through repositories; official guidance recommends skills | Retain the legacy information rather than claiming file commands were never supported; do not introduce project-level `.codex/commands/` |
| Sub-agent | https://developers.openai.com/codex/subagents | Standalone TOML files in personal `~/.codex/agents/` or project `.codex/agents/`; require name/description/developer_instructions | `.codex/agents/<name>.toml` (strategy: `copy-file`, installDir: `.codex/agents`) |

### Tabnine CLI

Homepage: https://docs.tabnine.com/

Scope: the MCP and guidelines sources describe **Tabnine IDE Agent**; the command source describes **Tabnine CLI**. Cross-client discovery has not been runtime-verified.

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.tabnine.com/main/getting-started/tabnine-agent/mcp-intro-and-setup | `.tabnine/mcp_servers.json` under the project or home directory; key `mcpServers` | `.tabnine/mcp_servers.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.tabnine.com/main/getting-started/tabnine-agent/guidelines | `$PROJECT/.tabnine/guidelines/` or `~/.tabnine/guidelines/`; Markdown format | `.tabnine/guidelines/<name>.md` (strategy: `create-file-in-dir`, installDir: `.tabnine/guidelines`) |
| Skill | — | No official contract sufficient to confirm automatic CLI skill-directory discovery found in this audit | Do not rely on third-party lists to claim support or assert that the product has no skills at all |
| Command | https://docs.tabnine.com/main/getting-started/tabnine-cli/features/commands | User `~/.tabnine/agent/commands/`; project `.tabnine/agent/commands/`; **TOML** with `prompt` and optional `description` | `.tabnine/agent/commands/<name>.toml`; nested directories produce `/namespace:command`; the old documentation link no longer works |
| Sub-agent | — | No standalone CLI sub-agent file contract verified | Do not infer a `.tabnine/agents/` directory |

### Kimi Code

Homepage: https://moonshotai.github.io/kimi-cli/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://moonshotai.github.io/kimi-cli/en/customization/mcp.html | `~/.kimi/mcp.json`; key `mcpServers`; format compatible with other MCP clients | macOS/Linux: `~/.kimi/mcp.json` → key `mcpServers`; Windows: `%USERPROFILE%\.kimi\mcp.json` → key `mcpServers` |
| Prompt | https://moonshotai.github.io/kimi-cli/en/customization/agents.html | The `${KIMI_AGENTS_MD}` variable merges `AGENTS.md` files from the project root to the working directory, including `.kimi/AGENTS.md` | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://moonshotai.github.io/kimi-cli/en/customization/skills.html | Project/user `.kimi/skills/` and `.agents/skills/`; compatible with `.claude/skills/`, `.codex/skills/`, and other paths; see official docs for name-conflict precedence | `.kimi/skills/<name>/SKILL.md` with YAML frontmatter; compatibility paths establish Kimi discovery, not a continued Codex recommendation for the old path |
| Command | https://moonshotai.github.io/kimi-cli/en/customization/skills.html | Official docs describe loading skills through slash commands, not an independent command-file directory | Reuse the Skill contract; do not invent `.kimi/commands/` |
| Sub-agent | https://moonshotai.github.io/kimi-cli/en/customization/agents.html | YAML `version: 1` / `agent`; a parent agent's `subagents.<name>` entries contain `path` and `description`, referencing child-agent YAML; `system_prompt_path` can reference Markdown | Install YAML and prompt dependencies, register them in the parent, and load it with `kimi --agent-file <parent.yaml>`; automatic discovery in `.kimi/agents/` is unverified. Copying one `.md` is insufficient |

### Trae

Homepage: https://docs.trae.ai/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.trae.ai/ide/add-mcp-servers | Project `.trae/mcp.json`; key `mcpServers`; requires enabling **Project MCP** in Settings > MCP | `.trae/mcp.json` → key `mcpServers`; writing a file does not bypass user trust or enablement steps |
| Prompt | https://docs.trae.ai/ide/rules | `.trae/rules/`; each rule is a `.md` file with YAML frontmatter (alwaysApply, description, globs); also compatible with AGENTS.md | `.trae/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.trae/rules`) |
| Skill | https://docs.trae.ai/ide/skills | Project `.trae/skills/{skill_name}/SKILL.md`; global `~/.trae/skills`; YAML frontmatter (name, description) | `.trae/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.trae/skills`) |
| Command | — | No standalone custom slash-command file contract verified | Do not equate built-in slash menus with automatic file discovery |
| Sub-agent | — | No installable standalone sub-agent file contract verified in this audit | Custom agents in the UI do not establish a `.trae/agents/` contract |

### OpenClaw

Homepage: https://docs.openclaw.ai/

Scope: paths are relative to the **configured agent workspace**, by default `~/.openclaw/workspace`, not necessarily the current repository. The old third-party `openclawlab.com` reference and a historical closed issue are not authoritative evidence of current capabilities.

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.openclaw.ai/gateway/config-extensions ; https://docs.openclaw.ai/gateway/configuration | Native managed MCP definitions live in JSON5 `~/.openclaw/openclaw.json` under `mcp.servers`, for embedded OpenClaw and other runtime adapters | Supports stdio/remote servers; requires JSON5-aware **nested-object merging**. This is neither `mcpServers` nor the `mcp serve` feature that exposes OpenClaw itself as an MCP server |
| Prompt | https://docs.openclaw.ai/concepts/agent-workspace | `<workspace>/AGENTS.md` provides behavioral instructions for the agent workspace | Defaults to `~/.openclaw/workspace/AGENTS.md`; resolve the workspace first instead of blindly writing cwd's `AGENTS.md` |
| Skill | https://docs.openclaw.ai/tools/skills | `<workspace>/skills/`; managed `~/.openclaw/skills/`; also reads workspace `.agents/skills/` and user `~/.agents/skills/`, subject to state configuration | `<workspace>/skills/<name>/SKILL.md`; defaults to `~/.openclaw/workspace/skills/<name>/SKILL.md`, not `<cwd>/.openclaw/skills/` |
| Command | https://docs.openclaw.ai/tools/skills ; https://docs.openclaw.ai/tools/slash-commands | Skill names can be exposed as slash commands | Reuse Skill installation; do not infer `.openclaw/commands/` |
| Sub-agent | — | Multi-agent/runtime configuration does not establish automatic discovery of standalone sub-agent files | No drop-in installation directory for standalone files verified in this audit; retain the unverified status |

### Mistral Vibe

Homepage: https://docs.mistral.ai/vibe/code/cli/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.mistral.ai/vibe/code/cli/configuration ; https://docs.mistral.ai/vibe/code/cli/configuration-reference | `.vibe/config.toml` or `~/.vibe/config.toml`; `[[mcp_servers]]` array; each entry requires `name` and `transport`, with other fields depending on transport | `.vibe/config.toml`; preserve TOML arrays of tables, distinct from Codex's `[mcp_servers.<name>]` |
| Prompt | https://docs.mistral.ai/vibe/code/cli/agents | User `~/.vibe/AGENTS.md`; every `AGENTS.md` between cwd and the trusted root in a trusted workspace | `AGENTS.md` in project root; respect trusted-folder boundaries |
| Skill | https://docs.mistral.ai/vibe/code/cli/skills | Project `.vibe/skills/` / `.agents/skills/`; user `~/.vibe/skills/` / `~/.agents/skills/` | `.vibe/skills/<name>/SKILL.md` with YAML frontmatter; project discovery requires trust |
| Command | https://docs.mistral.ai/vibe/code/cli/skills | Skills default to `user-invocable: true` and are invoked with `/skill-name`; supports `disable-model-invocation` | Reuse the Skill directory; do not create an undocumented `.vibe/commands/` directory |
| Sub-agent | https://docs.mistral.ai/vibe/code/cli/agents | Project `.vibe/agents/<name>.toml` or user `~/.vibe/agents/<name>.toml`; `agent_type = "subagent"` and `description`; `system_prompt_id` can reference `.vibe/prompts/<id>.md` | Generate TOML and handle prompt dependencies; a regular `agent_type = "agent"` definition is not a delegation-only subagent |

### Claude Desktop

Homepage: https://claude.com/download/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://modelcontextprotocol.io/docs/develop/connect-local-servers ; https://claude.com/download/ | macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`; Windows: `%APPDATA%\Claude\claude_desktop_config.json`; Linux: `~/.config/Claude/claude_desktop_config.json`; key `mcpServers` | The official MCP tutorial specifies all three paths. The download page's FAQ identifies Linux as beta; use Settings > Developer > Edit Config to locate the active file |
| Prompt | — | No automatically discovered project-rule file verified | UI project instructions are not a project-root file contract |
| Skill | https://support.claude.com/en/articles/12512180-using-skills-in-claude | Supports custom Skills: package the skill directory as a ZIP and upload through the UI, subject to account capabilities/settings | The product supports skills, but not by copying into a project skill directory; this installer's file-writing model cannot directly claim support |
| Command | — | No standalone command-file installation contract verified | Do not confuse this with Claude Code's `.claude/commands/` |
| Sub-agent | — | No standalone sub-agent file installation contract verified | Do not confuse this with Claude Code's `.claude/agents/` |

---

### Cline

Scope: the current [configuration layout](https://docs.cline.bot/getting-started/config) consolidates global/project directories. MCP still needs a CLI vs IDE distinction.

| Asset Type | Official Source | Verified Contract / Open Question |
|------------|-----------------|-----------------------------------|
| MCP | https://docs.cline.bot/mcp/mcp-overview | CLI `~/.cline/data/settings/cline_mcp_settings.json`, overridable with `CLINE_MCP_SETTINGS_PATH`; key `mcpServers`. In the IDE, use the actual file opened by Configure MCP Servers. HTTP requires `type: "streamableHttp"`, not another client's transport name |
| Prompt | https://docs.cline.bot/customization/cline-rules | `.cline/rules/` or `.clinerules/`; user `~/.cline/rules/`; also supports project `AGENTS.md`. A new host-specific target could use `.cline/rules/<name>.md` |
| Skill | https://docs.cline.bot/customization/skills | `.cline/skills/<name>/SKILL.md` and `~/.cline/skills/`; compatible with `.clinerules/skills/` and `.agents/skills/`. Current docs state that global skills win over project skills on name conflicts; do not apply another host's precedence |
| Command | https://docs.cline.bot/core-workflows/using-commands ; https://docs.cline.bot/getting-started/config | Enabled skills can be invoked with slash commands. `.cline/workflows/` and `~/.cline/workflows/` directories are also confirmed, but the standalone workflow schema needs further evidence. Use the Skill contract for now rather than infer a command-file format |
| Sub-agent | https://docs.cline.bot/features/subagents ; https://docs.cline.bot/getting-started/config | CLI/Desktop support subagents; IDE extensions do not. The configuration layout lists `.cline/agents/`, but the cited pages do not define the entry format or required fields. Do not infer `.md` drop-in support before verifying the exact contract |

### Amp

Scope: **Amp CLI** configuration, not hosted MCP definitions stored by ampcode.com or arbitrary editor settings.

| Asset Type | Official Source | Verified Contract / Open Question |
|------------|-----------------|-----------------------------------|
| MCP | https://ampcode.com/docs/cli/settings ; https://ampcode.com/docs/customize/mcp | Project `.amp/settings.json` / `.jsonc`; user `~/.config/amp/settings.json` / `.jsonc`; **literal key** `"amp.mcpServers"`, not a nested `amp` object; supports command/args/env or url/headers |
| Prompt | https://ampcode.com/docs/customize/agents-md | `AGENTS.md` in cwd, parent directories, and subtrees; personal `~/.config/amp/AGENTS.md` / `~/.config/AGENTS.md`; future target: project-root `AGENTS.md` |
| Skill | https://ampcode.com/docs/customize/skills | Project `.agents/skills/`; personal preferred path `~/.config/agents/skills/`; also reads `~/.agents/skills/` and `~/.config/amp/skills/`. Settings that disable global compatibility directories affect discovery |
| Command | — | No standalone command-file discovery contract verified; do not guess `.amp/commands/` |
| Sub-agent | — | Built-in delegation does not establish a standalone asset-file contract; custom sub-agent installation format remains unverified |

### Continue

| Asset Type | Official Source | Verified Contract / Open Question |
|------------|-----------------|-----------------------------------|
| MCP | https://docs.continue.dev/customize/deep-dives/mcp | Project `.continue/mcpServers/` accepts standalone YAML blocks (requiring name/version/schema) or compatible JSON MCP configs (key `mcpServers`); the main `config.yaml` uses an `mcpServers` list, not the same JSON map |
| Prompt | https://docs.continue.dev/customize/deep-dives/rules | `.continue/rules/<name>.md`; Markdown with YAML frontmatter is recommended; config YAML rules are also supported. The adapter selects Markdown rules |
| Skill | — | This audit has not verified a Continue-client automatic-discovery contract for `SKILL.md`; publishing skills for other agents does not establish that Continue itself reads them |
| Command | https://docs.continue.dev/customize/deep-dives/prompts | Markdown with `invokable: true` exposes a slash prompt; `prompts` in `config.yaml` can also reference Hub blocks. The local discovery/registration mechanism needs further clarification; do not infer `.continue/commands/` |
| Sub-agent | — | No standalone custom sub-agent file installation contract verified; checks run through an external coding agent's skill do not establish a Sub-agent asset contract for the Continue host |

### Zed Agent

Scope: the native **Zed Agent**, not every external ACP agent or terminal thread opened inside Zed. Sources: https://zed.dev/docs/ai/mcp.md ; https://zed.dev/docs/ai/instructions.md ; https://zed.dev/docs/ai/skills.md ; https://zed.dev/docs/reference/all-settings.md .

| Asset Type | Verified Contract / Installation Target |
|------------|-------------------------------------|
| MCP | User `~/.config/zed/settings.json` uses JSONC and the `context_servers` map. Local entries have a string `command`, `args`, and `env`; remote entries have `url` and optional `headers`. Merge into settings without replacing unrelated settings or comments; do not use the obsolete nested `command.path` representation. Confirm the platform config directory before enabling another OS target. |
| Prompt | Project instructions use the **first matching** file in this order: `.rules`, `.cursorrules`, `.windsurfrules`, `.clinerules`, `.github/copilot-instructions.md`, `AGENT.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Append to the effective file; use `AGENTS.md` when none exists. Personal instructions are `~/.config/zed/AGENTS.md` (`%APPDATA%\\Zed\\AGENTS.md` on Windows). Writing a lower-priority file does not guarantee loading. |
| Skill | Project `.agents/skills/<name>/SKILL.md`; user `~/.agents/skills/`. Preserve the full directory bundle. Frontmatter requires a lowercase, hyphenated name (1–64 characters, no consecutive/leading/trailing hyphens) and a description. |
| Command | Skills can be invoked by slash command; there is no separately verified drop-in command-file format. Reuse Skill installation. |
| Sub-agent | External agents, profiles and delegation do not establish a standalone Sub-agent asset format. No automatic file target verified here. |

### Aider

Official sources: https://aider.chat/docs/usage/conventions.html ; https://aider.chat/docs/config/aider_conf.html .

| Asset Type | Verified Contract / Installation Target |
|------------|-------------------------------------|
| Prompt | The official example uses project-root `CONVENTIONS.md`, loaded read-only through `read` in `.aider.conf.yml`. `read` may be a scalar filename or an array. Append marker-delimited instructions to `CONVENTIONS.md` **and** register it, preserving existing read files, YAML comments and unrelated options. A copied Markdown file alone is not an always-loaded configuration. |
| MCP / Skill / Command / Sub-agent | No native standalone installation protocol verified in these sources. Aider's built-in `/read` command, third-party MCP wrappers, and arbitrary files added to a chat are not independent installable asset types. Reject these operations with an explicit reason rather than inventing directories. |

### goose

Scope: current goose CLI/Desktop file contracts. The original `block/goose` repository now redirects to `aaif-goose/goose`; the official site is https://goose-docs.ai/ . Sources: https://goose-docs.ai/docs/guides/config-files/ ; https://github.com/aaif-goose/goose/blob/main/documentation/docs/guides/context-engineering/using-goosehints.md ; https://github.com/aaif-goose/goose/blob/main/documentation/docs/guides/context-engineering/using-skills.md .

| Asset Type | Verified Contract / Installation Target |
|------------|-------------------------------------|
| MCP | YAML `~/.config/goose/config.yaml` on macOS/Linux; `%APPDATA%\\Block\\goose\\config\\config.yaml` on Windows. Merge under the `extensions` **map**, not an array. Local entries use `type: stdio`, `name`, `enabled: true`, `cmd`, `args`, and `envs`; remote entries use `type: streamable_http`, `uri`, and optional `headers`. Preserve existing extensions/provider settings and YAML comments. SSE is no longer supported; reject it instead of relabeling it as HTTP. |
| Prompt | Default context filenames are `AGENTS.md` and `.goosehints`; project ancestors and global context are also loaded. `CONTEXT_FILE_NAMES` can override the names with a JSON array. Use project `AGENTS.md` by default and respect this override; files remain Markdown instruction content. |
| Skill | Project `.agents/skills/<name>/SKILL.md`; user `~/.agents/skills/`. Name/description frontmatter and supporting resources are required. The built-in Skills platform extension is enabled by default; a user-disabled extension is not bypassed by writing files. |
| Command | Skills are loadable through `/skills`; recipes/custom slash commands are separate mechanisms. No independent Markdown command target selected by this adapter. |
| Sub-agent | Custom agents and recipes need their own format/registration verification; do not infer a `.goose/agents/` drop-in directory from delegation support. |


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
| MCP | https://docs.factory.ai/harness/mcp | Project `.factory/mcp.json`; user `~/.factory/mcp.json`; top-level `mcpServers`; project definitions win on name conflicts; preserve transport-specific type/command/url fields |
| Prompt | https://docs.factory.ai/harness/agents-md | `AGENTS.md` with project and subtree scope; a future target can use project-root `AGENTS.md` with marker-based appending, without overwriting existing team instructions |
| Skill | https://docs.factory.ai/harness/skills | Project `.factory/skills/<name>/SKILL.md`; user `~/.factory/skills/`; directory bundle with YAML frontmatter (name, description) |
| Command | https://docs.factory.ai/harness/custom-slash-commands | Project `.factory/commands/<name>.md`; user `~/.factory/commands/`; executable scripts are also supported. A future adapter must handle permissions/platform differences rather than merely change extensions |
| Sub-agent | https://docs.factory.ai/harness/subagents | Project `.factory/droids/<name>.md`; user `~/.factory/droids/`; Markdown with YAML frontmatter; project definitions win on name conflicts; only the top level is scanned. Do not substitute `.factory/agents/` |



### Google Antigravity (Candidate)

Scope: MCP file paths below are explicitly documented for **CLI and IDE**. The App has an MCP management UI, but its automatic file-discovery contract is not established here; do not assume all surfaces discover the same files.

| Asset Type | Official Source | Verified Contract / Open Question |
|------------|-----------------|-----------------------------------|
| MCP | https://antigravity.google/docs/mcp/ | **CLI and IDE:** project `.agents/mcp_config.json`; user `~/.gemini/config/mcp_config.json`; top-level `mcpServers`. The CLI and IDE sections each state these paths; App file discovery remains unverified. Transport-specific fields must follow this product's schema |
| Prompt | https://antigravity.google/docs/rules/ | Project `AGENTS.md` / `GEMINI.md`, or `.agents/rules/*.md`; modular rules require valid YAML frontmatter and trigger metadata, and are ignored without it. Prefer explicitly selecting `AGENTS.md` for a future target rather than modular rules without frontmatter |
| Skill | https://antigravity.google/docs/skills/ | Project `.agents/skills/<name>/SKILL.md`; global `~/.gemini/config/skills/`; backward-compatible with `.agent/skills/`. Distinguish additional App / IDE / CLI discovery paths |
| Command | https://antigravity.google/docs/ide/workflows/ | The official notice says legacy Workflows stop working on **2026-10-19** and recommends migration to Agent skills. This audit is after that cutoff; do not list legacy `.agent/workflows/` as a usable target for a new adapter |
| Sub-agent | — | No standalone sub-agent file installation contract verified; multi-agent UI workflows are not an on-disk format |





Other clients (for example OpenHands and Pi) are **not declared unsupported** by their omission. Add a candidate only after verifying its exact file protocol, client surface and scope from official sources.

---

## How to Add a New Host (Contribution Guide)

1. **Documentation first:** verify official sources and add a candidate section with proposed ID, client/version scope, project/user paths, config keys, schema, required metadata and unresolved questions. Do not add it to the registered-adapter matrix yet.
2. In a separate implementation change, create `src/hosts/<id>.ts` implementing `HostAdapter` from `types.ts`, then register it in `src/hosts/index.ts`.
3. Ensure each supported asset type has a valid `writeStrategy` **and format handling**: convert MCP schemas, preserve JSONC/JSON5/TOML, copy full skill bundles, generate frontmatter and register dependent files where required. A config key alone is not a transport schema.
4. Do not force skills-as-commands, custom modes, uploaded ZIPs or parent-registered agents into independent Markdown asset directories. If the model cannot represent a contract yet, use `NOT_SUPPORTED(reason)` with a precise explanation and document the gap.
5. Add file-contract acceptance scenarios under `tests/features/host/` or `tests/features/complex/`, parse generated artifacts, and run them through the built CLI. Reserve unit tests for isolated utilities and metadata smoke checks. Cover client/version and OS differences; detection paths are hints, not proof of an installed client or supported capability.
6. Keep source links, verification date and known adapter gaps current. Never promote third-party path guesses or historical "not planned" issues above current official documentation.
