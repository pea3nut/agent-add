# Host Capability Matrix

This file is the **single source of truth for target host adapter configurations** in `agent-add`.
It records upstream file contracts, not a guarantee that the current CLI implements every entry.
Adapters in `src/hosts/<id>.ts` should converge on these contracts; known gaps are listed below.
Official documentation links are maintained here, not duplicated in adapter metadata.

**Project contracts last verified: 2026-11-01 (UTC). Global contract sources checked: 2026-11-04 (UTC).** Sources are official product documentation unless explicitly labeled otherwise.
Descriptions below are paraphrases, not verbatim quotations. Contracts were documented before the corresponding adapter changes.

> **Documentation proposal: `--global` is not implemented yet.** The current CLI remains project-only. The global contracts below describe the intended next implementation, pending review; they are not a claim of released support.

### Scope and interpretation

- The first matrix covers the **24 registered adapters**. [New host candidates](#new-host-candidates-not-implemented) are separate: their proposed IDs are **not** accepted by `--host` yet.
- A capability means an installable **file contract**, not merely a similarly named UI feature or a built-in command. Skills that expose slash commands are not a second, independent command-file format.
- Project and global installation are **separate contracts**. The project matrix and project details use project-relative paths; the global matrix and global details use verified user-level paths. Never derive one from the other by prefixing the user's home directory. An upstream capability does not imply an implemented adapter. Respect workspace trust.
- A Skill is a **directory bundle** with a `SKILL.md` entry point: preserve supporting scripts/resources, not just the entry file. Same-name discovery precedence is host-specific.
- Write strategies name installer operations, not upstream formats. JSONC, TOML, nested keys, frontmatter and registration requirements must be handled explicitly; changing an extension or copying Markdown alone does not convert a format.
- This reference and the executable file-contract scenarios are **not runtime validation in all native hosts**. Unverified protocols remain unverified rather than being inferred from third-party host lists or old issues. A successful HTTP response or redirect is not proof: check the final page's product, client/version scope and actual file contract.

---

## Project Capability Matrix

> ✅ = documented file contract | ↪ = legacy, skill-backed, or requires registration (see details) | ? = historical contract not reverified | — = no standalone file contract verified
>
> These are project-scoped upstream capabilities, **not current adapter implementation status**. A dash also marks capabilities outside the current project-only contract. CLI/IDE scope matters. Global support never enables a project target implicitly.

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
| Windsurf / legacy Cascade | `windsurf` | — | ↪ (legacy) | ↪ (legacy) | ↪ (Cascade only) | — |
| Roo Code | `roo-code` | ✅ | ✅ | ✅ | ✅ | — |
| Kiro (CLI V3 / IDE 1.0) | `kiro` | ✅ | ✅ | ✅ | ↪ | ✅ |
| Codex CLI | `codex` | ✅ (TOML) | ✅ | ✅ | — | ✅ (TOML) |
| Tabnine (IDE Agent / CLI; see scope below) | `tabnine` | ✅ | ✅ | — | ✅ (TOML) | — |
| Kimi Code CLI | `kimi` | — | ✅ | ✅ | ↪ | ↪ (YAML + registration) |
| Trae | `trae` | ✅ | ✅ | ✅ | — | — |
| OpenClaw | `openclaw` | — | — | — | — | — |
| Mistral Vibe | `vibe` | ✅ (TOML) | ✅ | ✅ | ↪ | ✅ (TOML) |
| Claude Desktop | `claude-desktop` | — | — | — | — | — |
| Zed Agent | `zed` | — | ✅ | ✅ | ↪ (skills) | — |
| Cline | `cline` | — | ✅ | ✅ | ↪ (skills) | — |
| Continue | `continue` | ✅ | ✅ | ? | ↪ | — |
| Aider | `aider` | — | ↪ (read registration) | — | — | — |
| goose | `goose` | — | ✅ | ✅ | ↪ (skills) | — |
| Amp CLI | `amp` | ✅ (JSONC) | ✅ | ✅ | — | — |

## Implementation Status and Remaining Boundaries

The CLI now registers the six hosts in Issue #7. Supported file contracts are
covered by the existing Scenario Test features under `tests/features/`;
this does not claim native application or live MCP-server validation.

| Area | Implemented behavior | Boundary |
|------|----------------------|----------|
| MCP conversion | opencode/Kilo native local/remote schema; Codex HTTP and stdio TOML; Vibe stdio with environment; VS Code `servers`; Amp literal `amp.mcpServers` | Unsupported fields/transports fail explicitly. Remote Vibe transport is not implemented. Existing JSONC comments and unrelated settings are preserved. Native TOML table additions preserve existing text; inline TOML representations may require serialization and normalize comments/formatting. |
| Native MCP fields | Validate opencode/Kilo booleans, positive integer millisecond timeouts and strict OAuth objects; Codex booleans, paths, string-valued headers, environment/tool lists, per-tool settings and finite nonnegative second timeouts before writing | Preserve `false`, empty lists/maps and valid zero/fractional Codex timeouts without coercion. Kilo OAuth supports `clientId`, `clientSecret` and `scope`; opencode additionally supports `callbackPort` (1–65535) and `redirectUri`. Invalid fields fail preflight without writing any asset, including with `--dry-run` or `--overwrite`. |
| Other native MCP options | Validate documented Gemini/Qwen working directories, trust, timeout, tool lists and OAuth field types; Roo disabled/tool/watch-path options and 1–3600 second timeouts; Kiro disabled/tool lists | These are checks of verified optional fields, not exhaustive native-host schema validation. Other unverified extension fields are not interpreted. opencode/Kilo, Codex, Vibe, Gemini/Qwen, VS Code and Roo consume portable transport selectors; Roo uses native `streamable-http` rather than `http`. |
| Prompt registration | Kilo writes a rule and registers `instructions`; Aider writes `CONVENTIONS.md` and merges YAML `read` | No interactive UI registration is attempted. A registration error is checked before writing prompt content; multi-file writes are not a filesystem transaction. |
| Prompt selection | Zed respects first-match precedence; Gemini respects project `context.fileName` | Project targets only; configured Gemini filenames must remain inside the project. |
| Native assets | Codex and Vibe subagents use valid TOML; Gemini and Tabnine commands use TOML; Codex skills use `.agents/skills`; skill directories retain supporting resources | Codex unsupported metadata and Vibe reserved `main` are rejected rather than silently discarded. |
| Audit regressions F01–F08 | Native serialization, BOM/CRLF frontmatter, host override precedence, semantic MCP comparison, changed standalone-rule conflicts, same-batch non-Skill name-collision preflight | Different marker-delimited prompt content is updated. Different standalone content conflicts. Incoming non-Skill name collisions block the batch before writes; existing destination conflicts are not a transactional batch rollback. Skills retain entry-file-based existence behavior. |
| Configuration safety | MCP names reject reserved structural keys (`__proto__`, `constructor`, `prototype`, `<<`) before batch writes; Claude Code remote entries normalize HTTP/SSE transport; atomic writes preserve file symlinks | Symlink chains resolve to their existing referent. Dangling or cyclic links fail explicitly without replacing the link. New files use `0600`; existing file permissions are retained. |
| MCP source shape | A flat single-server map is distinguished from a direct server definition by its object structure, not by reserving transport field names. | Names such as `command`, `url`, `serverUrl`, `httpUrl`, `type` and `transport` remain valid flat-map server names; direct scalar `httpUrl` is still a server definition. |
| Ambiguous configuration and remote endpoints | Reject duplicate decoded object keys in JSON and JSONC, including nested objects and objects in arrays; repeated names in different objects are valid. Reparse edits and check the effective value before writing. Validate HTTP(S) URL structure, hostname and port without connecting to the endpoint. | Preserve ambiguous files byte-for-byte rather than editing an ineffective duplicate section. Gemini/Qwen `${ENV_VAR}` URL placeholders are preserved and structurally checked using dummy substitution, without reading environment values. |
| Kimi | Subagents remain explicitly unsupported by this installer | Upstream YAML files require parent registration and `--agent-file` selection; this is not lack of product support. |
| Kiro | Current Markdown custom agents, steering and skills | Older CLI 2.x schemas are not migrated. Custom-agent `resources`/skill registration remains the user's responsibility; default-agent discovery does not imply custom-agent availability. |
| Windsurf | Historical project rules, skills and Cascade workflows only | Current redirects do not reverify historical MCP/Windows paths. Legacy rules/skills and Cascade workflows are not Devin Local. |
| Claude Desktop / OpenClaw | No project installation target enabled | IDs remain registered so unsupported requests fail explicitly. |
| Copilot / Augment | VS Code compatibility MCP / Auggie CLI JSONC settings | These IDs do not establish portable Copilot harness or Augment IDE-extension configuration behavior. |
| New host limits | Zed/Cline/Goose support project Prompt and Skill; Amp supports MCP, Prompt and Skill; Continue supports MCP and Prompt; Aider supports registered Prompt | No new independent Command/Sub-agent format is invented. Continue uses `.continue/mcpServers/agent-add.json`. |
| Global scope | Not implemented; the contracts below are a documentation proposal | Adding this reference does not change the CLI, adapters, or project-only defaults. |


---

## Installation Scope Contract (Proposed)

`--global` selects **user-level installation for the entire invocation**, not a different host and not a system-wide installation for every OS user. Omitting it keeps the existing project-only behavior.

| Concern | Project (default) | Global (`--global`, proposed) |
|---------|-------------------|-------------------------------|
| Destination | The selected host's project contract, relative to the invocation's working directory | The selected host's explicit user-level contract, independent of the working directory |
| Capability lookup | Project host + asset type | Global host + asset type; never inherit project support |
| Inputs | Relative local sources and pack paths resolve from the invocation's working directory | The same source resolution; `./skills/example` does **not** become home-relative |
| Writes and conflicts | Only the selected project target and its required registrations | Only the selected user target and its required registrations; project copies do not count as already installed or conflicting |
| Missing target | Explicit unsupported error; no user-level fallback | Explicit unsupported error; no project-level fallback, invented directory, or UI automation |

Additional requirements for the implementation:

- The scope applies equally to repeated asset flags, every asset expanded from `--pack`, and extra assets combined with a pack. Pack manifests remain scope-neutral: no per-asset scope field or mixed project/global writes in one invocation. Use two invocations to install in both scopes.
- Capability handling remains consistent with the current installer: an explicitly requested unsupported asset fails before any destination writes; unsupported assets supplied only by a pack are reported as skipped **in the selected scope**. Skipped global assets must never be installed into the project instead. Validation and write failures are not unsupported-asset skips.
- `--host` selects the same registered host ID in either scope. Non-interactive use still requires it. Without it, the interactive selector must identify the selected scope; global selection must not depend on finding project configuration.
- A global install neither migrates nor deletes project assets, nor edits project registration files. Project installs must likewise not register assets in user settings. Installer conflict checks are scope-local; runtime discovery, merging and same-name precedence remain the host's responsibility. A project copy is not universally higher priority.
- Paths below are **native defaults**, not a universal `~/.<host>` convention. Resolve the current user's home and platform-specific application directories explicitly. Host-native root overrides need separately verified handling (for example, `CODEX_HOME` and `VIBE_HOME`); either honor the relevant override or report the unsupported configuration rather than silently writing to an unused default. Do not add a generic scope/path templating system just to express these contracts.
- Preserve unrelated user settings, comments where supported, permissions and existing file-symlink behavior. Do not grant trust, enable disabled extensions, bypass managed policy, or rewrite embedded MCP commands, environment placeholders and resource references just because scope changes. Global files can affect every local project; they are not automatically synchronized to hosted/cloud sessions.
- Installation results must identify the selected scope and actual destination. File installation is not proof that the native application loaded the asset; restart, registration and trust requirements still apply.

## Global Capability Matrix (Proposed, Not Implemented)

This is an independent **user-level** baseline for the same 24 registered IDs. It does not change the project matrix. Only entries with a selected, sourced file contract may be enabled in the future adapter.

> ✅ = verified user-level file contract selected below | ↪ = legacy or skill-backed, not a new standalone format | ? = user-level target/format still needs verification; keep unavailable | — = no independent file target selected; keep unsupported
>
> Every cell is **unimplemented in agent-add global mode**, including ✅. `?` and `—` do not assert that the upstream product lacks the feature.

| Host | ID | MCP | Prompt | Skill | Command | Sub-agent |
|------|----|-----|--------|-------|---------|-----------|
| Cursor | `cursor` | ✅ | ? | ✅ | ? | ✅ |
| Claude Code | `claude-code` | ✅ | ✅ | ✅ | ↪ | ✅ |
| GitHub Copilot (VS Code) | `github-copilot` | ? | ? | ? | ? | ? |
| Gemini CLI | `gemini` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kilo Code | `kilo-code` | ✅ | ? | ✅ | ✅ | ✅ |
| Qwen Code | `qwen-code` | ✅ | ? | ✅ | ? | ? |
| opencode | `opencode` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Augment / Auggie | `augment` | ✅ | ? | ✅ | ✅ | ✅ |
| Windsurf / legacy Cascade | `windsurf` | ? | ? | ? | ? | — |
| Roo Code | `roo-code` | ? | ? | ✅ | ? | — |
| Kiro (CLI V3 / IDE 1.0) | `kiro` | ✅ | ✅ | ✅ | ↪ | ✅ |
| Codex CLI | `codex` | ✅ | ✅ | ✅ | — | ✅ |
| Tabnine | `tabnine` | ? | ? | — | ? | — |
| Kimi Code CLI | `kimi` | ✅ | ? | ? | ↪ | — |
| Trae | `trae` | ? | ? | ? | — | — |
| OpenClaw | `openclaw` | ? | ? | ✅ | — | — |
| Mistral Vibe | `vibe` | ✅ | ? | ? | ↪ | ? |
| Claude Desktop | `claude-desktop` | ✅ | — | — | — | — |
| Zed Agent | `zed` | ? | ? | ? | ↪ | — |
| Cline | `cline` | ? | ✅ | ✅ | ↪ | ? |
| Continue | `continue` | ? | ? | ? | ? | — |
| Aider | `aider` | — | ? | — | — | — |
| goose | `goose` | ? | ? | ? | ↪ | — |
| Amp CLI | `amp` | ✅ | ✅ | ✅ | — | — |

### Global File Contracts and Sources

All paths in this section are user-scoped. `<name>` is the inferred asset name. Skill targets denote **whole directory bundles**, including `SKILL.md` and supporting resources. JSON/JSONC/TOML conversion requirements remain native to each host; the project serialization rules are reusable only where the global schema actually matches.

| Host | Selected global targets | Official sources and constraints |
|------|-------------------------|----------------------------------|
| Cursor | MCP: `~/.cursor/mcp.json` → `mcpServers`; Skill: `~/.cursor/skills/<name>/SKILL.md`; Sub-agent: `~/.cursor/agents/<name>.md` | [MCP](https://cursor.com/docs/context/mcp), [skills](https://cursor.com/docs/skills), [subagents](https://cursor.com/docs/subagents). User Rules in the settings UI do not establish a writable `~/.cursor/AGENTS.md` contract. Global Command remains unverified; do not extrapolate the legacy project directory. |
| Claude Code | MCP: `~/.claude.json` → top-level `mcpServers`; Prompt: `~/.claude/CLAUDE.md`; Skill: `~/.claude/skills/<name>/SKILL.md`; legacy Command: `~/.claude/commands/<name>.md`; Sub-agent: `~/.claude/agents/<name>.md` | [MCP scopes](https://code.claude.com/docs/en/mcp#user-scope), [memory](https://code.claude.com/docs/en/memory), [skills/legacy commands](https://code.claude.com/docs/en/skills), [subagents](https://code.claude.com/docs/en/sub-agents). MCP **user scope** is top-level `mcpServers`, not the project-specific `projects[<path>]` local scope in the same file. Do not use `~/.claude/.mcp.json`. |
| Gemini CLI | MCP: `~/.gemini/settings.json` → `mcpServers`; Prompt: `~/.gemini/GEMINI.md`; Skill: `~/.gemini/skills/<name>/SKILL.md`; Command: `~/.gemini/commands/<name>.toml`; Sub-agent: `~/.gemini/agents/<name>.md` | [Settings](https://geminicli.com/docs/reference/configuration/), [memory](https://geminicli.com/docs/cli/gemini-md/), [skills](https://geminicli.com/docs/cli/skills/), [commands](https://geminicli.com/docs/cli/custom-commands/), [subagent format](https://geminicli.com/docs/core/subagents/), [agent discovery](https://geminicli.com/docs/reference/commands/). Commands require TOML conversion. Global prompt selection must respect the effective user `context.fileName`, without reading project settings to redirect a user-level write. |
| Kilo Code | MCP: `~/.config/kilo/kilo.jsonc` → `mcp`; Skill: `~/.kilo/skills/<name>/SKILL.md`; Command: `~/.config/kilo/commands/<name>.md`; Sub-agent: `~/.config/kilo/agents/<name>.md` | [MCP](https://kilo.ai/docs/automate/mcp/using-in-kilo-code), [skills](https://kilo.ai/docs/customize/skills), [commands](https://kilo.ai/docs/customize/workflows), [subagents](https://kilo.ai/docs/customize/custom-subagents). Note the **different skill and config roots**. Preserve existing `.json`/`.jsonc` selection and convert MCP schema, rather than creating a competing file. Global Prompt registration still needs verification. |
| Qwen Code | MCP: `~/.qwen/settings.json` → `mcpServers`; Skill: `~/.qwen/skills/<name>/SKILL.md` | [User settings](https://qwenlm.github.io/qwen-code-docs/en/users/configuration/settings/), [MCP format](https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/), [skills](https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/). Global Prompt, Command and Sub-agent targets/formats remain unselected in this proposal. |
| opencode | MCP: `~/.config/opencode/opencode.json` / `opencode.jsonc` → `mcp`; Prompt: `~/.config/opencode/AGENTS.md`; Skill: `~/.config/opencode/skills/<name>/SKILL.md`; Command: `~/.config/opencode/commands/<name>.md`; Sub-agent: `~/.config/opencode/agents/<name>.md` | [Config](https://opencode.ai/docs/config/), [MCP](https://opencode.ai/docs/mcp-servers/), [rules](https://opencode.ai/docs/rules), [skills](https://opencode.ai/docs/skills), [commands](https://opencode.ai/docs/commands/), [agents](https://opencode.ai/docs/agents/). Keep JSONC-aware merging, native MCP conversion and subagent metadata. `OPENCODE_CONFIG` is an additional config layer, not permission to treat any arbitrary path as the global default. |
| Augment / Auggie | MCP: `~/.augment/settings.json` → `mcpServers`; Skill: `~/.augment/skills/<name>/SKILL.md`; Command: `~/.augment/commands/<name>.md`; Sub-agent: `~/.augment/agents/<name>.md` | [Auggie settings](https://docs.augmentcode.com/cli/settings), [MCP](https://docs.augmentcode.com/cli/integrations), [skills](https://docs.augmentcode.com/using-augment/skills), [commands](https://docs.augmentcode.com/using-augment/custom-commands), [subagents](https://docs.augmentcode.com/cli/subagents). MCP is an Auggie CLI contract, not a claim about the IDE extension's private settings. Preserve JSONC comments. |
| Roo Code | Skill: `~/.roo/skills/<name>/SKILL.md` | [Skills](https://docs.roocode.com/features/skills). Other user-level contracts remain unselected; do not manufacture a global MCP path by moving `.roo/mcp.json` under home. |
| Kiro | MCP: `~/.kiro/settings/mcp.json` → `mcpServers`; Prompt: `~/.kiro/steering/<name>.md`; Skill: `~/.kiro/skills/<name>/SKILL.md`; Sub-agent: `~/.kiro/agents/<name>.md` | [MCP](https://kiro.dev/docs/mcp/configuration/), [steering](https://kiro.dev/docs/steering/), [skills](https://kiro.dev/docs/skills/), [agent locations](https://kiro.dev/docs/custom-agents/creating/), [agent format](https://kiro.dev/docs/custom-agents/configuration-reference/). CLI V3 / IDE 1.0 scope, not a migration of CLI 2.x JSON. Custom-agent resource registration remains necessary; no independent Command directory. |
| Codex CLI | MCP: `~/.codex/config.toml` → `[mcp_servers.<name>]`; Prompt: `~/.codex/AGENTS.md` (or the effective `AGENTS.override.md`); Skill: `~/.agents/skills/<name>/SKILL.md`; Sub-agent: `~/.codex/agents/<name>.toml` | [Config](https://developers.openai.com/codex/config-basic/), [MCP](https://developers.openai.com/codex/mcp/), [instructions](https://developers.openai.com/codex/guides/agents-md), [skills](https://developers.openai.com/codex/skills), [subagents](https://developers.openai.com/codex/subagents). `CODEX_HOME` relocates the Codex config/instructions root, **not** the documented `$HOME/.agents/skills` root. Update the effective non-empty override file when present rather than an ignored `AGENTS.md`. No independent Command target selected. |
| Kimi Code CLI | MCP: `~/.kimi/mcp.json` → `mcpServers` | [MCP](https://moonshotai.github.io/kimi-cli/en/customization/mcp.html). This user-level contract does not enable a project MCP target. Skill/global instruction discovery still needs a selected target. YAML subagent registration is not a standalone Markdown drop-in contract. |
| OpenClaw | Skill: `~/.openclaw/skills/<name>/SKILL.md` in the default state | [Skills](https://docs.openclaw.ai/tools/skills), [configuration](https://docs.openclaw.ai/gateway/configuration). This is a shared state-owned skill root, not the configured agent workspace. Respect verified profile/state-root overrides before writing. Do not treat `~/.openclaw/workspace/AGENTS.md` as a universal user prompt or infer MCP installation from the existence of `openclaw.json`. |
| Mistral Vibe | MCP: `~/.vibe/config.toml` → `[[mcp_servers]]` | [Configuration](https://docs.mistral.ai/vibe/code/cli/configuration), [schema](https://docs.mistral.ai/vibe/code/cli/configuration-reference). Respect `VIBE_HOME` and native arrays of tables; retain existing transport-conversion limits. Global Prompt/Skill/Sub-agent targets still need separate verification. |
| Claude Desktop | MCP: macOS `~/Library/Application Support/Claude/claude_desktop_config.json`; Windows `%APPDATA%\Claude\claude_desktop_config.json`; key `mcpServers` | [Official local-server setup](https://modelcontextprotocol.io/docs/develop/connect-local-servers). Select by OS, preserve unrelated settings, and retain the documented local stdio contract. No verified Linux target selected; fail explicitly there. This does not enable any project target or Claude Code assets. |
| Cline | Prompt: `~/.cline/rules/<name>.md`; Skill: `~/.cline/skills/<name>/SKILL.md` | [Configuration layout](https://docs.cline.bot/getting-started/config), [rules](https://docs.cline.bot/customization/cline-rules), [skills](https://docs.cline.bot/customization/skills). `CLINE_DIR` can relocate the root and needs explicit handling. MCP settings and standalone agents/workflows need their precise schema verified before adding targets. |
| Amp CLI | MCP: `~/.config/amp/settings.json` / `settings.jsonc` → literal `amp.mcpServers`; Prompt: `~/.config/amp/AGENTS.md`; Skill: `~/.config/amp/skills/<name>/SKILL.md` | [Settings](https://ampcode.com/docs/cli/settings), [MCP](https://ampcode.com/docs/customize/mcp), [instructions](https://ampcode.com/docs/customize/agents-md), [skills](https://ampcode.com/docs/customize/skills). Config paths here are verified for macOS/Linux; verify the Windows config path separately. The host-specific skill target avoids changing the shared agent-agnostic skill root. |

For `github-copilot`, `windsurf`, `tabnine`, `trae`, `zed`, `continue`, `aider` and `goose`, no global file target is selected in this proposal. Their project contracts below remain unchanged. Verify exact user paths, client/OS scope, schema and registration requirements before replacing `?` cells; historical paths, UI features and project support are insufficient evidence.

### Scope Acceptance Criteria for the Later Implementation

- With isolated project and user roots, run the same asset once without `--global` and once with it. Parse the native outputs and verify only the selected scope changed, including required registrations.
- Cover differing contracts, not only directory copies: Claude Code user MCP versus project MCP, Codex user skills versus its config root, native TOML commands/subagents, and OS-specific Claude Desktop MCP.
- Keep a same-name asset with different content in the other scope. It must not cause an installer conflict, skip, overwrite, migration or deletion in the selected scope.
- Verify explicit unsupported assets fail before writes, pack-only unsupported assets skip in the selected scope, mixed pack/explicit flags use one scope, and no fallback destination is created.
- Verify relative source/manifest paths still resolve from cwd, user config overrides are handled explicitly, and a global install works outside a repository. Preserve unrelated user settings and native prompt-file precedence.
- Add these business behaviors to the existing Scenario Test feature groups; implementation and executable scenarios are deliberately **not** part of this documentation-only change.

---

## Project Host Configuration Details

### Cursor

Homepage: https://cursor.com/docs

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://cursor.com/docs/context/mcp | Project `.cursor/mcp.json`; key `mcpServers` | `.cursor/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://cursor.com/docs/context/rules | Native rules use `.cursor/rules/*.mdc`; `AGENTS.md` is also supported as a cross-tool standard | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://cursor.com/docs/skills | Project `.cursor/skills/` and `.agents/skills/`; each bundle contains `SKILL.md` | Keep `.cursor/skills/<name>/SKILL.md` as the host-specific target; copy the directory bundle |
| Command | https://cursor.com/changelog/1-6 ; https://cursor.com/docs/skills | The v1.6 `.cursor/commands/<name>.md` contract is legacy; current docs recommend `/migrate-to-skills` to migrate commands to skills | Mark as legacy; prefer `.cursor/skills/<name>/SKILL.md` for new reusable workflows. A redirect to the skills page is not current evidence for the old command path |
| Sub-agent | https://cursor.com/docs/subagents | Project `.cursor/agents/`; Markdown format | `.cursor/agents/<name>.md` (strategy: `copy-file`) |

### Claude Code

Homepage: https://code.claude.com/docs/en

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://code.claude.com/docs/en/mcp | Shared project `.mcp.json`, key `mcpServers`; HTTP servers require `type: "http"` | `.mcp.json` → key `mcpServers`; do not omit the remote transport type or overwrite unrelated configuration |
| Prompt | https://code.claude.com/docs/en/memory | `./CLAUDE.md` or `./.claude/CLAUDE.md` | `CLAUDE.md` in project root (strategy: `append-with-marker`) |
| Skill | https://code.claude.com/docs/en/skills | Project `.claude/skills/<skill-name>/SKILL.md` | `.claude/skills/<name>/SKILL.md` (strategy: `copy-file`) |
| Command | https://code.claude.com/docs/en/skills | Commands have merged into skills; `.claude/commands/` remains backward-compatible | Existing `.claude/commands/<name>.md` files remain usable; prefer `.claude/skills/<name>/SKILL.md` for new workflows |
| Sub-agent | https://code.claude.com/docs/en/sub-agents | Project `.claude/agents/`; Markdown with YAML frontmatter | `.claude/agents/<name>.md` (strategy: `copy-file`) |

### GitHub Copilot

Homepage: https://docs.github.com/en/copilot

Scope: the adapter's MCP target is **VS Code**, not Copilot CLI/cloud configuration. Do not write `.vscode/mcp.json` and claim CLI support.

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://code.visualstudio.com/docs/agent-customization/mcp-servers | VS Code workspace `.vscode/mcp.json` ; key `servers`. These remain available for compatibility and are labeled deprecated in the guided flow | Preserve `servers` for the existing VS Code target. Portable project `.mcp.json` uses `mcpServers`; interactive-input servers are not forwarded to Copilot harness sessions. Select the destination and harness explicitly; do not merely rename the key |
| Prompt | https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot | `.github/copilot-instructions.md`; also supports `.github/instructions/*.instructions.md` and `AGENTS.md` | `.github/copilot-instructions.md` (strategy: `append-with-marker`) |
| Skill | https://docs.github.com/en/copilot/concepts/agents/about-agent-skills | Project `.github/skills/`, `.claude/skills/`, `.agents/skills/` | `.github/skills/<name>/SKILL.md` requires frontmatter (name, description) and the complete directory bundle |
| Command | https://docs.github.com/en/copilot/tutorials/customization-library/prompt-files/your-first-prompt-file | `.github/prompts/<name>.prompt.md`; YAML frontmatter; invoked with `/<name>` | `.github/prompts/<name>.prompt.md` (strategy: `copy-file`) |
| Sub-agent | https://code.visualstudio.com/docs/copilot/customization/custom-agents | VS Code project `.github/agents/`, also `.claude/agents/`; Markdown with YAML frontmatter | `.github/agents/<name>.agent.md`; follow the VS Code schema rather than substituting cloud-agent field constraints |

### Gemini CLI

Homepage: https://geminicli.com/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://geminicli.com/docs/tools/mcp-server/ | Project `.gemini/settings.json`; key `mcpServers`; `url` selects SSE and `httpUrl` selects Streamable HTTP | Preserve native `httpUrl`; normalize explicit HTTP transport aliases to `httpUrl`, and SSE to `url`. A bare `url` retains native SSE semantics. Reject mixed endpoint fields or conflicting transport selectors. |
| Prompt | https://geminicli.com/docs/cli/gemini-md/ | Defaults to project-hierarchy `GEMINI.md` files; `context.fileName` can specify another name or a list of names, such as `AGENTS.md` | Default target: `GEMINI.md`; respect the user's configured context filenames instead of claiming the default file is always loaded |
| Skill | https://geminicli.com/docs/cli/skills/ | Project `.gemini/skills/` or `.agents/skills/` | Within the same scope, `.agents/skills/` takes precedence over `.gemini/skills/`; `.gemini/skills/<name>/SKILL.md` remains a valid host-specific target |
| Command | https://geminicli.com/docs/cli/custom-commands/ | Project `.gemini/commands/`; TOML with required `prompt` and optional `description` | `.gemini/commands/<name>.toml`; serialize TOML rather than renaming Markdown; reload with `/commands reload` |
| Sub-agent | https://geminicli.com/docs/core/subagents/ | Project `.gemini/agents/*.md`; Markdown with YAML frontmatter | `.gemini/agents/<name>.md` (strategy: `copy-file`) |

### Kilo Code

Homepage: https://kilo.ai/docs

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://kilo.ai/docs/automate/mcp/using-in-kilo-code | Project `kilo.jsonc` / `.kilo/kilo.jsonc` (also supports `.json`); top-level `mcp` | Local: `{type: "local", command: [exe, ...args], environment: {...}}`; remote: `{type: "remote", url: ...}`; requires JSONC-aware merging and schema conversion |
| Prompt | https://kilo.ai/docs/customize/custom-rules | Reference `.kilo/rules/<name>.md` through file paths or globs in `kilo.jsonc`'s `instructions`; legacy `.kilocode/rules/` is automatically compatible | New installations must write the rule file **and** register it in `instructions`; creating the new directory alone is insufficient |
| Skill | https://kilo.ai/docs/customize/skills | Project `.kilo/skills/` | `.kilo/skills/<name>/SKILL.md`; YAML frontmatter (name, description); do not retain old directories unverified by current docs |
| Command | https://kilo.ai/docs/customize/workflows | Project `.kilo/commands/`; legacy `.kilocode/workflows/` is migrated automatically | `.kilo/commands/<name>.md`, not `.kilocode/commands/` |
| Sub-agent | https://kilo.ai/docs/customize/custom-subagents | Project `.kilo/agents/`; Markdown with YAML frontmatter | `.kilo/agents/<name>.md`; agents can also be defined under `agent` in `kilo.jsonc` |

### Qwen Code

Homepage: https://qwenlm.github.io/qwen-code-docs/en/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/ | `.qwen/settings.json`; key `mcpServers`; `url` selects SSE and `httpUrl` selects Streamable HTTP | Same transport normalization and ambiguity rejection as Gemini CLI; preserve headers and unrelated settings. |
| Prompt | https://qwenlm.github.io/qwen-code-docs/en/blog/updates/weekly-update-2026-03-06/ | The official update confirms automatic loading of project-root `AGENTS.md`; do not promise a fixed conflict precedence against `QWEN.md` without evidence | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/ | Project `.qwen/skills/<skill-name>/SKILL.md` | `.qwen/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.qwen/skills`) |
| Command | https://qwenlm.github.io/qwen-code-docs/en/users/features/commands/ | Custom Commands section: project `.qwen/commands/`; Markdown with optional YAML frontmatter; legacy TOML is deprecated | `.qwen/commands/<name>.md`; project definitions win on name conflicts; subdirectories become colon-separated namespaces |
| Sub-agent | https://qwenlm.github.io/qwen-code-docs/en/users/features/sub-agents/ | Project `.qwen/agents/`; Markdown with YAML frontmatter | `.qwen/agents/<name>.md` (strategy: `copy-file`, installDir: `.qwen/agents`) |

### opencode

Homepage: https://opencode.ai/docs

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://opencode.ai/docs/mcp-servers/ ; https://opencode.ai/docs/config/ ; https://opencode.ai/config.json | Project `opencode.json` / `opencode.jsonc`; top-level `mcp`. The config reference documents project paths and precedence | Local servers use `type: "local"`, `command: [exe, ...args]`, and `environment`; remote servers use `type: "remote"` and `url`. Do not copy server objects directly from `mcpServers` |
| Prompt | https://opencode.ai/docs/rules | Project-root `AGENTS.md`; also supports a `CLAUDE.md` fallback | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://opencode.ai/docs/skills | Project `.opencode/skills/<name>/SKILL.md` | `.opencode/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.opencode/skills`) |
| Command | https://opencode.ai/docs/commands | Project `.opencode/commands/`; Markdown with YAML frontmatter | `.opencode/commands/<name>.md` (strategy: `copy-file`, installDir: `.opencode/commands`) |
| Sub-agent | https://opencode.ai/docs/agents | Project `.opencode/agents/`; Markdown with YAML frontmatter | `.opencode/agents/<name>.md` (strategy: `copy-file`, installDir: `.opencode/agents`) |

### Augment

Homepage: https://docs.augmentcode.com/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.augmentcode.com/cli/integrations ; https://docs.augmentcode.com/cli/settings | **Auggie CLI** project `.augment/settings.json`; local override `.augment/settings.local.json`; key `mcpServers` | The settings reference explicitly supports JSONC, including comments and trailing commas. For the IDE extension's settings panel / Import from JSON, see https://docs.augmentcode.com/setup-augment/mcp ; do not assume it shares the CLI file |
| Prompt | https://docs.augmentcode.com/setup-augment/guidelines | Project `.augment/rules/`; also supports `AGENTS.md`/`CLAUDE.md` | `.augment/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.augment/rules`) |
| Skill | https://docs.augmentcode.com/using-augment/skills | Project `.augment/skills/`; compatible with `.agents/skills/` and `.claude/skills/` | `.augment/skills/<name>/SKILL.md`; copy the directory bundle and respect host discovery precedence |
| Command | https://docs.augmentcode.com/using-augment/custom-commands | Project `.augment/commands/<name>.md` | `.augment/commands/<name>.md` (strategy: `copy-file`, installDir: `.augment/commands`) |
| Sub-agent | https://docs.augmentcode.com/cli/subagents | Project `.augment/agents/`; Markdown with YAML frontmatter | `.augment/agents/<name>.md` (strategy: `copy-file`, installDir: `.augment/agents`) |

### Windsurf

Official legacy reference: https://docs.devin.ai/desktop/cascade

Scope: the registered `windsurf` ID refers to legacy Windsurf/Cascade, **not Devin Local**. Former Windsurf documentation URLs now redirect to Devin documentation. Current Devin Desktop no longer starts or reopens Cascade conversations; the workflow contracts below are historical, not new Devin Local capabilities. Current documentation retains some `.windsurf/` project directories for compatibility, but that does not verify every historical MCP path.

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.devin.ai/desktop/devin-local/customizations#mcp-servers | — | Not supported: no verified project MCP target for this adapter. Devin Local is a different host contract, not a replacement path for `windsurf` |
| Prompt | https://docs.devin.ai/desktop/devin-local/customizations#rules | `.windsurf/rules/*.md` is a legacy compatibility directory; current documentation prefers `.devin/rules/*.md` | `.windsurf/rules/<name>.md` is a legacy target (strategy: `create-file-in-dir`); keep client/version scope explicit rather than presenting it as the preferred current directory |
| Skill | https://docs.devin.ai/desktop/devin-local/customizations#skills | Project `.windsurf/skills/` is read for legacy compatibility; current Devin Local prefers `.devin/skills/` . Bundles contain `SKILL.md` with name/description frontmatter | `.windsurf/skills/<name>/SKILL.md` is a legacy project target. |
| Command | https://docs.devin.ai/desktop/cascade#workflows | Cascade-only workflows: preferred `.devin/workflows/*.md`, legacy `.windsurf/workflows/*.md` fallback. **Devin Local does not support workflows** | `.windsurf/workflows/<name>.md` is a historical Cascade target, not a Devin Local command directory. Migrate workflows to skills for Devin Local |
| Sub-agent | — | No standalone sub-agent file installation contract verified | Do not infer automatic discovery in `.windsurf/agents/` from built-in parallelism |

### Roo Code

Homepage: https://docs.roocode.com/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.roocode.com/features/mcp/using-mcp-in-roo | Project `.roo/mcp.json`; key `mcpServers` | `.roo/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.roocode.com/features/custom-instructions | `.roo/rules/` is loaded recursively in filename order; also supports `.roo/rules-{modeSlug}/` | `.roo/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.roo/rules`) |
| Skill | https://docs.roocode.com/features/skills | Project `.roo/skills/`; also reads `.agents/skills/`; supports mode-specific `.roo/skills-{modeSlug}/` | `.roo/skills/<name>/SKILL.md` requires name and description in frontmatter; copy the complete directory bundle |
| Command | https://docs.roocode.com/features/slash-commands | `.roo/commands/`; filenames define command names, e.g. `review.md` → `/review` | `.roo/commands/<name>.md` (strategy: `copy-file`, installDir: `.roo/commands`) |
| Sub-agent | https://docs.roocode.com/features/custom-modes | Custom modes use `.roomodes` / `custom_modes.yaml`, not standalone drop-in sub-agent Markdown files | This audit does not equate mode configuration with a Sub-agent asset; do not create an unverified `.roo/agents/` directory |

### Kiro

Homepage: https://kiro.dev/docs/

Scope: current docs cover **IDE 1.0 / CLI V3**. CLI 2.x JSON agent settings have migration differences; do not treat all Kiro versions as interchangeable.

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://kiro.dev/docs/mcp/configuration/ | Workspace `.kiro/settings/mcp.json`; key `mcpServers` | `.kiro/settings/mcp.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://kiro.dev/docs/steering/ | Project `.kiro/steering/`; also loads `AGENTS.md`; supports inclusion frontmatter | `.kiro/steering/<name>.md`; custom agents must explicitly include steering in `resources`, e.g. `file://.kiro/steering/**/*.md` |
| Skill | https://kiro.dev/docs/skills/ | `.kiro/skills/<name>/SKILL.md` | The default agent discovers skills automatically; custom agents need `skill://` URIs in `resources`. Copying files alone does not guarantee availability |
| Command | https://kiro.dev/docs/skills/ ; https://kiro.dev/docs/steering/ | Skills and manual/auto steering can be invoked as slash commands | Reuse the Skill/Prompt contracts; no independent `.kiro/commands/` directory verified |
| Sub-agent | https://kiro.dev/docs/custom-agents/configuration-reference/ ; https://kiro.dev/docs/custom-agents/subagents/ | Workspace `.kiro/agents/`; the current format supports Markdown frontmatter and a prompt body | `.kiro/agents/<name>.md`; document version and `resources`/`includeMcpJson` behavior; migrate legacy JSON with `/upgrade-agent` |

### Codex CLI

Homepage: https://github.com/openai/codex

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://developers.openai.com/codex/config-basic/ ; https://developers.openai.com/codex/mcp/ ; https://github.com/openai/codex/blob/main/codex-rs/core/config.schema.json | Project `.codex/config.toml`, `[mcp_servers.<name>]`; project configuration is loaded only for trusted projects | Serialize stdio and HTTP entries as TOML, preserving environment variables and HTTP headers. The installer does not grant project trust. |
| Prompt | https://developers.openai.com/codex/guides/agents-md | `AGENTS.md` at the repository root and in subdirectories | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://developers.openai.com/codex/skills | Searches `.agents/skills/` at each project level from cwd to the repository root | `.agents/skills/<name>/SKILL.md`; `.codex/skills/` is no longer the current officially recommended path; include name/description frontmatter |
| Command | https://developers.openai.com/codex/skills | No standalone project command target selected; use project skills | Not supported as an independent asset |
| Sub-agent | https://developers.openai.com/codex/subagents | Standalone TOML files in project `.codex/agents/`; require name/description/developer_instructions | `.codex/agents/<name>.toml` (strategy: `copy-file`, installDir: `.codex/agents`) |

### Tabnine CLI

Homepage: https://docs.tabnine.com/

Scope: the MCP and guidelines sources describe **Tabnine IDE Agent**; the command source describes **Tabnine CLI**. Cross-client discovery has not been runtime-verified.

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.tabnine.com/main/getting-started/tabnine-agent/mcp-intro-and-setup | `.tabnine/mcp_servers.json` under the project directory; key `mcpServers` | `.tabnine/mcp_servers.json` → key `mcpServers` (strategy: `inject-json-key`) |
| Prompt | https://docs.tabnine.com/main/getting-started/tabnine-agent/guidelines | `$PROJECT/.tabnine/guidelines/`; Markdown format | `.tabnine/guidelines/<name>.md` (strategy: `create-file-in-dir`, installDir: `.tabnine/guidelines`) |
| Skill | — | No official contract sufficient to confirm automatic CLI skill-directory discovery found in this audit | Do not rely on third-party lists to claim support or assert that the product has no skills at all |
| Command | https://docs.tabnine.com/main/getting-started/tabnine-cli/features/commands | Project `.tabnine/agent/commands/`; **TOML** with `prompt` and optional `description` | `.tabnine/agent/commands/<name>.toml`; nested directories produce `/namespace:command`; the old documentation link no longer works |
| Sub-agent | — | No standalone CLI sub-agent file contract verified | Do not infer a `.tabnine/agents/` directory |

### Kimi Code

Homepage: https://moonshotai.github.io/kimi-cli/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://moonshotai.github.io/kimi-cli/en/customization/mcp.html | No verified project-level automatic-discovery target selected | Not supported; do not create an arbitrary project MCP file |
| Prompt | https://moonshotai.github.io/kimi-cli/en/customization/agents.html | The `${KIMI_AGENTS_MD}` variable merges `AGENTS.md` files from the project root to the working directory, including `.kimi/AGENTS.md` | `AGENTS.md` in project root (strategy: `append-with-marker`) |
| Skill | https://moonshotai.github.io/kimi-cli/en/customization/skills.html | Project `.kimi/skills/` and `.agents/skills/`; compatible with `.claude/skills/`, `.codex/skills/`, and other paths; see official docs for name-conflict precedence | `.kimi/skills/<name>/SKILL.md` with YAML frontmatter; compatibility paths establish Kimi discovery, not a continued Codex recommendation for the old path |
| Command | https://moonshotai.github.io/kimi-cli/en/customization/skills.html | Official docs describe loading skills through slash commands, not an independent command-file directory | Reuse the Skill contract; do not invent `.kimi/commands/` |
| Sub-agent | https://moonshotai.github.io/kimi-cli/en/customization/agents.html | YAML `version: 1` / `agent`; a parent agent's `subagents.<name>` entries contain `path` and `description`, referencing child-agent YAML; `system_prompt_path` can reference Markdown | Install YAML and prompt dependencies, register them in the parent, and load it with `kimi --agent-file <parent.yaml>`; automatic discovery in `.kimi/agents/` is unverified. Copying one `.md` is insufficient |

### Trae

Homepage: https://docs.trae.ai/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.trae.ai/ide/add-mcp-servers | Project `.trae/mcp.json`; key `mcpServers`; requires enabling **Project MCP** in Settings > MCP | `.trae/mcp.json` → key `mcpServers`; writing a file does not bypass user trust or enablement steps |
| Prompt | https://docs.trae.ai/ide/rules | `.trae/rules/`; each rule is a `.md` file with YAML frontmatter (alwaysApply, description, globs); also compatible with AGENTS.md | `.trae/rules/<name>.md` (strategy: `create-file-in-dir`, installDir: `.trae/rules`) |
| Skill | https://docs.trae.ai/ide/skills | Project `.trae/skills/{skill_name}/SKILL.md`; YAML frontmatter (name, description) | `.trae/skills/<name>/SKILL.md` (strategy: `copy-file`, installDir: `.trae/skills`) |
| Command | — | No standalone custom slash-command file contract verified | Do not equate built-in slash menus with automatic file discovery |
| Sub-agent | — | No installable standalone sub-agent file contract verified in this audit | Custom agents in the UI do not establish a `.trae/agents/` contract |

### OpenClaw

Homepage: https://docs.openclaw.ai/

No verified project-only installation contract is selected for this release. The ID remains registered to return explicit unsupported errors; no project paths are invented.

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.openclaw.ai/gateway/config-extensions ; https://docs.openclaw.ai/gateway/configuration | No verified project-level automatic installation target | Not supported in this release |
| Prompt | https://docs.openclaw.ai/concepts/agent-workspace | No verified project-level automatic installation target | Not supported in this release |
| Skill | https://docs.openclaw.ai/tools/skills | No verified project-level automatic installation target | Not supported in this release |
| Command | https://docs.openclaw.ai/tools/slash-commands | No verified standalone project command target | Not supported |
| Sub-agent | — | Multi-agent/runtime configuration does not establish automatic discovery of standalone sub-agent files | No drop-in installation directory for standalone files verified in this audit; retain the unverified status |

### Mistral Vibe

Homepage: https://docs.mistral.ai/vibe/code/cli/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://docs.mistral.ai/vibe/code/cli/configuration ; https://docs.mistral.ai/vibe/code/cli/configuration-reference | `.vibe/config.toml`; `[[mcp_servers]]` array; each entry requires `name` and `transport`, with other fields depending on transport | `.vibe/config.toml`; preserve TOML arrays of tables, distinct from Codex's `[mcp_servers.<name>]` |
| Prompt | https://docs.mistral.ai/vibe/code/cli/agents | Every `AGENTS.md` between cwd and the trusted root in a trusted workspace | `AGENTS.md` in project root; respect trusted-folder boundaries |
| Skill | https://docs.mistral.ai/vibe/code/cli/skills | Project `.vibe/skills/` / `.agents/skills/` | `.vibe/skills/<name>/SKILL.md` with YAML frontmatter; project discovery requires trust |
| Command | https://docs.mistral.ai/vibe/code/cli/skills | Skills default to `user-invocable: true` and are invoked with `/skill-name`; supports `disable-model-invocation` | Reuse the Skill directory; do not create an undocumented `.vibe/commands/` directory |
| Sub-agent | https://docs.mistral.ai/vibe/code/cli/agents | Project `.vibe/agents/<name>.toml`; `agent_type = "subagent"` and `description`; `system_prompt_id` can reference `.vibe/prompts/<id>.md` | Generate TOML and handle prompt dependencies; a regular `agent_type = "agent"` definition is not a delegation-only subagent |

### Claude Desktop

Homepage: https://claude.com/download/

| Asset Type | Doc URL | Verified Contract | Installation Target / Constraints |
|------------|---------|-------------|----------|
| MCP | https://modelcontextprotocol.io/docs/develop/connect-local-servers ; https://claude.com/download/ | No verified project-level automatic installation target | Not supported in this release |
| Prompt | — | No verified project-level automatic installation target | Not supported in this release |
| Skill | https://support.claude.com/en/articles/12512180-using-skills-in-claude | No verified project-level automatic installation target | Not supported in this release |
| Command | — | No standalone command-file installation contract verified | Do not confuse this with Claude Code's `.claude/commands/` |
| Sub-agent | — | No standalone sub-agent file installation contract verified | Do not confuse this with Claude Code's `.claude/agents/` |

---

### Cline

Scope: the current [configuration layout](https://docs.cline.bot/getting-started/config) consolidates project directories. MCP still needs a CLI vs IDE distinction.

| Asset Type | Official Source | Verified Contract / Open Question |
|------------|-----------------|-----------------------------------|
| MCP | https://docs.cline.bot/mcp/mcp-overview | No verified project-level automatic-discovery target selected; not supported in this release |
| Prompt | https://docs.cline.bot/customization/cline-rules | `.cline/rules/` or `.clinerules/`; also supports project `AGENTS.md`. A new host-specific target could use `.cline/rules/<name>.md` |
| Skill | https://docs.cline.bot/customization/skills | `.cline/skills/<name>/SKILL.md`; compatible with `.clinerules/skills/` and `.agents/skills/`. |
| Command | https://docs.cline.bot/core-workflows/using-commands ; https://docs.cline.bot/getting-started/config | Enabled skills can be invoked with slash commands. `.cline/workflows/` is also confirmed, but the standalone workflow schema needs further evidence. Use the Skill contract for now rather than infer a command-file format |
| Sub-agent | https://docs.cline.bot/features/subagents ; https://docs.cline.bot/getting-started/config | CLI/Desktop support subagents; IDE extensions do not. The configuration layout lists `.cline/agents/`, but the cited pages do not define the entry format or required fields. Do not infer `.md` drop-in support before verifying the exact contract |

### Amp

Scope: **Amp CLI** configuration, not hosted MCP definitions stored by ampcode.com or arbitrary editor settings.

| Asset Type | Official Source | Verified Contract / Open Question |
|------------|-----------------|-----------------------------------|
| MCP | https://ampcode.com/docs/cli/settings ; https://ampcode.com/docs/customize/mcp | Project `.amp/settings.json` / `.jsonc`; **literal key** `"amp.mcpServers"`, not a nested `amp` object; supports command/args/env or url/headers |
| Prompt | https://ampcode.com/docs/customize/agents-md | `AGENTS.md` in cwd, parent directories, and subtrees; future target: project-root `AGENTS.md` |
| Skill | https://ampcode.com/docs/customize/skills | Project `.agents/skills/` |
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
| MCP | No verified project-level MCP target selected; not supported in this release. |
| Prompt | Project instructions use the **first matching** file in this order: `.rules`, `.cursorrules`, `.windsurfrules`, `.clinerules`, `.github/copilot-instructions.md`, `AGENT.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Append to the effective file; use `AGENTS.md` when none exists. Writing a lower-priority file does not guarantee loading. |
| Skill | Project `.agents/skills/<name>/SKILL.md` |
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
| MCP | No verified project-level MCP target selected; not supported in this release. |
| Prompt | Default project context filenames are `AGENTS.md` and `.goosehints`. The adapter appends to project `AGENTS.md`; non-default context filename overrides are outside this adapter contract. |
| Skill | Project `.agents/skills/<name>/SKILL.md`; a user-disabled extension is not bypassed by writing files. |
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

1. **Documentation first:** verify official sources and add a candidate section with proposed ID, client/version scope, project paths, config keys, schema, required metadata and unresolved questions. Do not add it to the registered-adapter matrix yet.
2. In a separate implementation change, create `src/hosts/<id>.ts` implementing `HostAdapter` from `types.ts`, then register it in `src/hosts/index.ts`.
3. Ensure each supported asset type has a valid `writeStrategy` **and format handling**: convert MCP schemas, preserve JSONC/TOML, copy full skill bundles, generate frontmatter and register dependent files where required. A config key alone is not a transport schema.
4. Do not force skills-as-commands, custom modes, uploaded ZIPs or parent-registered agents into independent Markdown asset directories. If the model cannot represent a contract yet, use `NOT_SUPPORTED(reason)` with a precise explanation and document the gap.
5. Add file-contract acceptance scenarios under `tests/features/host/` or `tests/features/complex/`, parse generated artifacts, and run them through the built CLI. Reserve unit tests for isolated utilities and metadata smoke checks. Cover client/version and OS differences; detection paths are hints, not proof of an installed client or supported capability.
6. Keep source links, verification date and known adapter gaps current. Never promote third-party path guesses or historical "not planned" issues above current official documentation.
