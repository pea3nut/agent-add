# Data Model: Expand Host Support (002-more-hosts)

**Feature**: `002-more-hosts`  
**Date**: 2026-03-17

---

## Overview

This feature replaces the static `src/hosts.json` data file with a TypeScript Adapter class per host. The key type changes are:

1. `HostConfig` → renamed to `HostAdapter` (interface, not data object)
2. `AssetCapability.writeStrategy` — add `'create-file-in-dir'` value
3. Each host file exports a class `XxxAdapter implements HostAdapter`
4. `src/hosts/index.ts` registers adapters in a `Map<string, HostAdapter>`

---

## Types (`src/hosts/types.ts`)

### `AssetType` — unchanged

```typescript
export type AssetType = 'mcp' | 'skill' | 'prompt' | 'command' | 'subAgent';
```

### `WriteStrategy` — new `'create-file-in-dir'` value

```typescript
export type WriteStrategy =
  | 'append-with-marker'   // append content wrapped in begin/end markers to a fixed target file
  | 'inject-json-key'      // merge a JSON key into an existing JSON config file
  | 'copy-file'            // copy source file verbatim to target path
  | 'create-file-in-dir';  // NEW: create <assetName>.md inside installDir
```

### `AssetCapability` — extended, backward-compatible

```typescript
export interface AssetCapability {
  /** Whether this host supports this asset type. */
  supported: boolean;

  /**
   * Human-readable reason shown in the rejection error when supported === false.
   * Falls back to "This asset type is not supported by this host." if absent.
   */
  reason?: string;

  /** Path to the config file (MCP JSON/TOML). Platform-keyed object allowed. */
  configFile?: string | Record<string, string>;

  /** Top-level key inside the config file that holds the mcpServers map. */
  configKey?: string;

  /**
   * For create-file-in-dir and skill: directory where individual files are created.
   * For append-with-marker: unused.
   */
  installDir?: string;

  /** For skill: filename inside installDir/<assetName>/ (e.g. "SKILL.md"). */
  entryFile?: string;

  /** For command/subAgent: file extension of the generated file (default ".md"). */
  fileExtension?: string;

  /** For mcp (inject-json-key): JSON path pattern to the server entry. */
  pattern?: string;

  /** For append-with-marker: path to the target file. */
  targetFile?: string;

  /** Determines how the installer writes this asset type. */
  writeStrategy?: WriteStrategy;

  /** Custom marker format for append-with-marker (default derived from asset name). */
  markerFormat?: string;
}
```

### `HostDetection` — unchanged

```typescript
export interface HostDetection {
  /** Glob-style or literal paths indicating this host is installed. */
  paths: string[] | Record<string, string>;
}
```

### `HostAdapter` — replaces `HostConfig`

`HostConfig` is kept as a **type alias** pointing to `HostAdapter` for backward compatibility with existing internal callers, then removed once all callers are migrated.

```typescript
export interface HostAdapter {
  /** Unique host identifier used in --host flag (e.g. "windsurf"). */
  readonly id: string;

  /** Human-readable display name used in CLI messages (e.g. "Windsurf"). */
  readonly displayName: string;

  /** URL to the host's official documentation homepage. */
  readonly docs: string;

  /** Detection hints for auto-detect (future). */
  readonly detection: HostDetection;

  /** Capability declaration for each asset type. */
  readonly assets: Record<AssetType, AssetCapability>;
}

/** @deprecated Use HostAdapter */
export type HostConfig = HostAdapter;
```

---

## Registry (`src/hosts/index.ts`)

```typescript
// Replaces: import hostsDataRaw from '../hosts.json'
// New: import each adapter class and register

const hostRegistry: Map<string, HostAdapter> = new Map([
  ['cursor',         new CursorAdapter()],
  ['claude-code',    new ClaudeCodeAdapter()],
  ['claude-desktop', new ClaudeDesktopAdapter()],
  // Group-1
  ['windsurf',       new WindsurfAdapter()],
  ['github-copilot', new GitHubCopilotAdapter()],
  ['gemini',         new GeminiAdapter()],
  ['roo-code',       new RooCodeAdapter()],
  ['kilo-code',      new KiloCodeAdapter()],
  ['qwen-code',      new QwenCodeAdapter()],
  ['opencode',       new OpencodeAdapter()],
  ['augment',        new AugmentAdapter()],
  ['kiro',           new KiroAdapter()],
  ['tabnine',        new TabnineAdapter()],
  ['kimi',           new KimiAdapter()],
  ['trae',           new TraeAdapter()],
  ['openclaw',       new OpenclawAdapter()],
  // Group-2 (TOML MCP)
  ['codex',          new CodexAdapter()],
  ['vibe',           new VibeAdapter()],
]);

// Public API unchanged
export function getHost(id: string): HostAdapter | undefined { ... }
export function getAllHosts(): HostAdapter[] { ... }
export function getValidHostIds(): string[] { ... }
```

---

## Adapter Class Pattern

Every adapter is a plain class with no constructor arguments:

```typescript
// src/hosts/windsurf.ts
import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class WindsurfAdapter implements HostAdapter {
  readonly id = 'windsurf';
  readonly displayName = 'Windsurf';
  readonly docs = 'https://docs.windsurf.com/windsurf/mcp';
  readonly detection = {
    paths: ['~/.codeium/windsurf/', '.windsurf/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: { darwin: '~/.codeium/windsurf/mcp_config.json', linux: '~/.codeium/windsurf/mcp_config.json', win32: '%APPDATA%/Codeium/windsurf/mcp_config.json' },
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.windsurf/rules',
      writeStrategy: 'create-file-in-dir',
    },
    skill: {
      supported: true,
      installDir: '.windsurf/skills',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: NOT_SUPPORTED('Windsurf does not have a custom slash command mechanism equivalent to Command.'),
    subAgent: NOT_SUPPORTED('Windsurf does not have a sub-agent file format.'),
  };
}
```

TOML-format adapters override the MCP config path and rely on detection of `.toml` extension inside `mcp.ts` to dispatch to `smol-toml`-based write logic:

```typescript
// src/hosts/codex.ts  (TOML MCP)
mcp: {
  supported: true,
  configFile: { darwin: '~/.codex/config.toml', linux: '~/.codex/config.toml', win32: '%USERPROFILE%\\.codex\\config.toml' },
  writeStrategy: 'inject-json-key',   // handler detects .toml and routes to TOML writer
},
```

---

## Complete Host Capability Matrix

> ✅ = supported | ❌ = not supported | ⚠️ = partial/conditional

| Host | ID | MCP | Prompt | Skill | Command | Sub-agent |
|------|----|-----|--------|-------|---------|-----------|
| Cursor | `cursor` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Claude Code | `claude-code` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Claude Desktop | `claude-desktop` | ✅ | ❌ | ❌ | ❌ | ❌ |
| Windsurf | `windsurf` | ✅ global | ✅ create-file-in-dir | ✅ | ❌ | ❌ |
| GitHub Copilot | `github-copilot` | ✅ project | ✅ append | ❌ | ❌ | ❌ |
| Gemini CLI | `gemini` | ✅ project/global | ✅ append | ❌ | ❌ | ❌ |
| Roo Code | `roo-code` | ✅ project | ✅ create-file-in-dir | ✅ | ❌ | ❌ |
| Kilo Code | `kilo-code` | ✅ project | ✅ create-file-in-dir | ❌ | ❌ | ❌ |
| Qwen Code | `qwen-code` | ✅ project/global | ✅ append | ✅ | ❌ | ❌ |
| opencode | `opencode` | ✅ project/global | ✅ append | ❌ | ❌ | ❌ |
| Augment | `augment` | ✅ global | ✅ create-file-in-dir | ❌ | ❌ | ❌ |
| Kiro CLI | `kiro` | ✅ project/global | ✅ create-file-in-dir | ❌ | ❌ | ❌ |
| Tabnine CLI | `tabnine` | ✅ project/global | ✅ create-file-in-dir | ❌ | ❌ | ❌ |
| Kimi Code | `kimi` | ✅ global | ✅ append | ❌ | ❌ | ❌ |
| Trae | `trae` | ✅ project/global | ✅ append | ❌ | ❌ | ❌ |
| OpenClaw | `openclaw` | ✅ global | ✅ append | ✅ | ❌ | ❌ |
| Codex CLI | `codex` | ✅ TOML | ✅ append | ❌ | ❌ | ❌ |
| Mistral Vibe | `vibe` | ✅ TOML | ❌ | ❌ | ❌ | ❌ |

---

## Key Install Paths per Host

| Host | MCP Config File | Prompt Install Path | Skill Install Path |
|------|----------------|--------------------|--------------------|
| Cursor | `.cursor/mcp.json` → `mcpServers` | `AGENTS.md` (marker) | `.cursor/skills/<name>/SKILL.md` |
| Claude Code | `.claude/claude_desktop_config.json` | `CLAUDE.md` (marker) | `.claude/skills/<name>/SKILL.md` |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` | ❌ | ❌ |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | `.windsurf/rules/<name>.md` | `.windsurf/skills/<name>/SKILL.md` |
| GitHub Copilot | `.vscode/mcp.json` | `.github/copilot-instructions.md` (marker) | ❌ |
| Gemini CLI | `.gemini/settings.json` | `GEMINI.md` (marker) | ❌ |
| Roo Code | `.roo/mcp.json` | `.roo/rules/<name>.md` | `.roo/skills/<name>/SKILL.md` |
| Kilo Code | `.kilocode/mcp.json` | `.kilocode/rules/<name>.md` | ❌ |
| Qwen Code | `.qwen/settings.json` | `AGENTS.md` (marker) | `.qwen/skills/<name>/SKILL.md` |
| opencode | `opencode.json` | `AGENTS.md` (marker) | ❌ |
| Augment | `~/.augment/settings.json` | `.augment/rules/<name>.md` | ❌ |
| Kiro CLI | `.kiro/settings/mcp.json` | `.kiro/steering/<name>.md` | ❌ |
| Tabnine CLI | `.tabnine/mcp_servers.json` | `.tabnine/guidelines/<name>.md` | ❌ |
| Kimi Code | `~/.kimi/mcp.json` | `AGENTS.md` (marker) | ❌ |
| Trae | `.trae/mcp.json` | `.trae/project_rules.md` (marker) | ❌ |
| OpenClaw | `~/.openclaw/openclaw.json` | `AGENTS.md` (marker) | `.openclaw/skills/<name>/SKILL.md` |
| Codex CLI | `~/.codex/config.toml` (TOML table) | `AGENTS.md` (marker) | ❌ |
| Mistral Vibe | `.vibe/config.toml` (TOML array) | ❌ | ❌ |

---

## Installer Logic Changes (`src/installer.ts`)

### Explicit Flag Rejection (new)

Inserted before the `jobs[]` construction loop. Applies only to assets from explicit CLI flags (not `--pack`):

```typescript
interface ExplicitFlagItem {
  assetType: AssetType;
  source: string;
  fromExplicitFlag: true;  // new discriminator field
}
```

Rejection check:
```typescript
for (const item of explicitFlagItems) {
  const capability = host.assets[item.assetType];
  if (!capability.supported) {
    const reason = capability.reason ?? 'This asset type is not supported by this host.';
    process.stderr.write(
      `Error: Host "${host.id}" does not support asset type "${item.assetType}".\n\n` +
      `Reason: ${reason}\n\n` +
      `• View the full host capability matrix: ${README_URL}\n` +
      `• If you believe ${host.displayName} now supports this, feel free to open a PR: ${PR_URL}\n`
    );
    process.exit(2);
  }
}
```

Where `README_URL` is derived from `package.json` `repository.url` + `/blob/main/src/hosts/README.md`, and `PR_URL` is `<repo>/pulls`.

### Pack Skip Behavior — unchanged

`--pack` items that hit an unsupported capability continue to produce `{ status: 'skipped' }` results, unchanged from the original behavior.
