# agent-add

Cross-host AI Agent Pack installer CLI tool. Install MCP, Skill, Prompt, Command, Sub-agent assets into different AI agent hosts (Cursor, Claude Code, Claude Desktop, etc.) with a single command.

## Common Commands

```bash
npm run build          # tsup build, outputs dist/index.js (single-file CJS bundle)
npm run dev            # tsup --watch dev mode
npm test               # vitest: unit + integration tests
npm run test:contract  # CLI black-box contract tests only
npm run test:integration
npm run lint           # tsc --noEmit type checking
npm run install:vibe   # Install dev assets via pack manifest
```

Run a single test file: `npx vitest run tests/unit/manifest/manifest-schema.test.ts`

## Tech Stack

- TypeScript 5.x, strict mode, target Node.js 18 (CommonJS)
- Build: tsup (esbuild-based)
- Test: vitest (unit / integration / contract — three layers)
- 5 runtime dependencies: `commander`, `@inquirer/select`, `yaml`, `zod`, `smol-toml` (TOML read/write)
- No database, no install state files — all idempotency checks are based on actual filesystem state

## Architecture Overview

```
tests/
├── features/                # Gherkin Scenario Tests (triggered manually by AI agent)
│   ├── scenario-run-config.md  # Run config (executor=bash-shell)
│   ├── core/                # Core asset behavior tests (7 .feature files)
│   └── host/                # Cross-host compatibility tests (3 .feature files)
└── fixtures/                # Static fixture files (mcp/skill/prompt/command/sub-agent/pack)
```

```
src/
├── cli.ts              # Commander definition + TTY detection + interactive host selection
├── installer.ts        # Orchestration core: input parsing → explicit flag capability check → source resolution → validation → handler execution → summary
├── hosts/              # Host adapter layer (18 hosts)
│   ├── README.md       # Host capability matrix ← single source of truth; must read when adding/modifying hosts
│   ├── types.ts        # HostAdapter, AssetCapability, WriteStrategy types
│   ├── index.ts        # Host registry (Map<id, HostAdapter>)
│   └── <id>.ts         # Per-host Adapter class implementing HostAdapter interface
├── assets/             # 5 asset type handlers, each implementing AssetHandler interface
│   ├── mcp.ts          # JSON shallow merge + atomic write; .toml extension auto-dispatches to smol-toml path
│   ├── skill.ts        # Directory copy + SKILL.md entry validation
│   ├── prompt.ts       # append-with-marker (HTML marker idempotent append) or create-file-in-dir
│   ├── command.ts      # .md file copy
│   └── sub-agent.ts    # .md copy + YAML frontmatter agent-get/<host>/* prompt injection
├── source/             # Source resolution: local / git-ssh / git-https / http-file / inline-json / inline-md
│   ├── git.ts          # Sparse checkout with #path syntax support
│   ├── inline.ts       # Inline content written to temp file (inline-json / inline-md)
│   └── infer-name.ts   # Infer asset name from source string
├── manifest/           # Manifest JSON parsing and Zod validation
│   └── schema.ts       # ManifestSchema: { name: "ns/pack", assets: [...] }
└── utils/
    ├── fs.ts           # atomicWriteJSON, ensureDir, readJSONOrNull
    ├── detect-hosts.ts # Scan CWD and parent directories to detect installed hosts
    └── summary.ts      # Install result formatted output
```

### Core Data Flow

```
CLI flags / --pack Manifest
  → Explicit flag capability check (exit 2 if unsupported; only for explicit flags, --pack skips)
    → AssetDescriptor[] (type + source)
      → ResolvedSource[] (localPath + tempDir)
        → InstallJob[] (skip assets unsupported by host)
          → InstallResult[] (written / exists / updated / conflict / skipped / error)
            → Summary output
```

### Host Capability Matrix

Defined in `src/hosts/README.md` (single source of truth). Each host implements the `HostAdapter` interface in `src/hosts/<id>.ts` and registers in `src/hosts/index.ts`. When modifying or adding hosts, the adapter implementation must exactly match the field values in README.md. Unit tests are in `tests/unit/hosts/<id>.test.ts`, asserting exact values for every field.

Currently supported 18 hosts: `cursor`, `claude-code`, `claude-desktop`, `windsurf`, `github-copilot`, `gemini`, `roo-code`, `kilo-code`, `qwen-code`, `opencode`, `augment`, `kiro`, `tabnine`, `kimi`, `trae`, `openclaw`, `codex` (TOML), `vibe` (TOML)

### Key Design Decisions

- **Atomic JSON writes**: MCP config uses temp file + rename for safety
- **Marker blocks**: Prompt `append-with-marker` strategy uses `<!-- agent-get:<name> -->` HTML comments for idempotent append
- **create-file-in-dir strategy**: Prompt standalone file write (Windsurf, Roo Code, etc.), creates file at `installDir/<assetName>.md`, skips if already exists
- **TOML MCP**: `mcp.ts` detects `.toml` extension and auto-dispatches; Codex uses `[mcp_servers.<name>]` tables, Vibe uses `[[mcp_servers]]` arrays
- **Explicit flag rejection**: `installer.ts` checks explicit flag capability declarations before building jobs; `supported: false` outputs error with reason + README link and exits 2; `--pack` sources are not subject to this check (skipped instead)
- **Non-TTY strict mode**: CI environments must explicitly specify `--host`, otherwise exit 2
- **Inline sources**: source starting with `{` → `inline-json` (MCP only, format `{"name":{...}}`, key is asset name); source containing `\n` → `inline-md` (Prompt/Command/Sub-agent, name inferred from `# Heading`). Both inline sources write to temp files then follow normal flow, downstream handlers are unaware
- **HTTP cannot install Skill**: `http-file`, `inline-json`, `inline-md` sources are not allowed for Skill type assets (exit 2)
- **AGENT_ADD_HOME env var**: Overrides `os.homedir()` return value in `src/assets/mcp.ts`, used to redirect Claude Desktop / Codex host install paths to temp directories for test isolation

## Multi-language Documentation Sync

`README.md` is the primary document (English). `docs/README.zh-CN.md` (Chinese) and `docs/README.ja.md` (Japanese) are translations that mirror the primary document's structure.

When modifying content examples, code blocks, tables, etc. in `README.md`, the corresponding sections in `docs/README.zh-CN.md` and `docs/README.ja.md` must be updated in sync.
