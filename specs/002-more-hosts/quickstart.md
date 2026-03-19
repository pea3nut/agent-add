# Developer Quickstart: Expand Host Support (002-more-hosts)

**Feature**: `002-more-hosts`  
**Date**: 2026-03-17

This guide tells a developer exactly what to implement, in what order, to deliver this feature.

---

## Prerequisites

```bash
git checkout 002-more-hosts
npm install
npm test   # all existing tests should pass before you start
```

Add the TOML parsing dependency:

```bash
npm install smol-toml
```

---

## Step 1 — Extend `src/hosts/types.ts`

1. Add `'create-file-in-dir'` to the `writeStrategy` union in `AssetCapability`.
2. Rename `HostConfig` to `HostAdapter` (keep `export type HostConfig = HostAdapter` alias).
3. No other changes to types — all existing fields remain.

Reference: `specs/002-more-hosts/data-model.md` → "Types" section.

---

## Step 2 — Refactor `src/hosts/index.ts`

Remove the `hosts.json` import. The registry will be populated by importing each adapter class.

For now, keep the three existing adapters working by converting them to classes first (Step 3), then wire them up here.

Public API (`getHost`, `getAllHosts`, `getValidHostIds`) signatures are **unchanged**.

---

## Step 3 — Convert Existing Adapters to Classes

Refactor each of the three existing host files to export a class implementing `HostAdapter`:

- `src/hosts/cursor.ts` → `export class CursorAdapter implements HostAdapter`
- `src/hosts/claude-code.ts` → `export class ClaudeCodeAdapter implements HostAdapter`
- `src/hosts/claude-desktop.ts` → `export class ClaudeDesktopAdapter implements HostAdapter`

The class body declares `readonly` properties matching their current `hosts.json` entries.

Delete `src/hosts.json` once all three adapters are wired up in `index.ts`.

---

## Step 4 — Implement `create-file-in-dir` Write Strategy

In `src/assets/prompt.ts`, add a branch for the new strategy:

```typescript
if (capability.writeStrategy === 'create-file-in-dir') {
  const dir = path.resolve(cwd, capability.installDir!);
  const file = path.join(dir, `${assetName}.md`);
  await fs.promises.mkdir(dir, { recursive: true });
  // idempotent: skip if exists (unless --force)
  if (!force && existsSync(file)) {
    return { status: 'skipped', reason: 'already installed' };
  }
  await writeFileAtomic(file, content);
  return { status: 'installed', path: file };
}
```

Write a unit test in `tests/unit/assets/prompt-create-file-in-dir.test.ts`.

---

## Step 5 — Implement TOML MCP Write Support

In `src/assets/mcp.ts`, detect `.toml` config file extension and dispatch to a TOML-aware writer instead of the JSON `inject-json-key` path:

```typescript
if (configFilePath.endsWith('.toml')) {
  await writeTomlMcp(configFilePath, mcpName, mcpConfig, host.id);
  return { status: 'installed' };
}
```

Implement `writeTomlMcp` (can be a private function in `mcp.ts`):

- **Codex** (`host.id === 'codex'`): uses `[mcp_servers.<name>]` TOML table format
- **Vibe** (`host.id === 'vibe'`): uses `[[mcp_servers]]` array format

Both must be idempotent (skip if the same `name` already exists).

Use `smol-toml` for read/write. Write atomically (temp file + rename).

Write unit tests in `tests/unit/assets/mcp-toml.test.ts`.

---

## Step 6 — Implement Group-1 Host Adapters (13 files)

Create one file per host under `src/hosts/`. Each file exports a single class.

Use the adapter template from `data-model.md` ("Adapter Class Pattern" section).

Hosts and their key config details:

| File | Class | MCP | Prompt strategy | Skill |
|------|-------|-----|----------------|-------|
| `windsurf.ts` | `WindsurfAdapter` | `~/.codeium/windsurf/mcp_config.json` | `create-file-in-dir` → `.windsurf/rules/` | `.windsurf/skills/<n>/SKILL.md` |
| `github-copilot.ts` | `GitHubCopilotAdapter` | `.vscode/mcp.json` | `append-with-marker` → `.github/copilot-instructions.md` | ❌ |
| `gemini.ts` | `GeminiAdapter` | `.gemini/settings.json` | `append-with-marker` → `GEMINI.md` | ❌ |
| `roo-code.ts` | `RooCodeAdapter` | `.roo/mcp.json` | `create-file-in-dir` → `.roo/rules/` | `.roo/skills/<n>/SKILL.md` |
| `kilo-code.ts` | `KiloCodeAdapter` | `.kilocode/mcp.json` | `create-file-in-dir` → `.kilocode/rules/` | ❌ |
| `qwen-code.ts` | `QwenCodeAdapter` | `.qwen/settings.json` | `append-with-marker` → `AGENTS.md` | `.qwen/skills/<n>/SKILL.md` |
| `opencode.ts` | `OpencodeAdapter` | `opencode.json` | `append-with-marker` → `AGENTS.md` | ❌ |
| `augment.ts` | `AugmentAdapter` | `~/.augment/settings.json` | `create-file-in-dir` → `.augment/rules/` | ❌ |
| `kiro.ts` | `KiroAdapter` | `.kiro/settings/mcp.json` | `create-file-in-dir` → `.kiro/steering/` | ❌ |
| `tabnine.ts` | `TabnineAdapter` | `.tabnine/mcp_servers.json` | `create-file-in-dir` → `.tabnine/guidelines/` | ❌ |
| `kimi.ts` | `KimiAdapter` | `~/.kimi/mcp.json` | `append-with-marker` → `AGENTS.md` | ❌ |
| `trae.ts` | `TraeAdapter` | `.trae/mcp.json` | `append-with-marker` → `.trae/project_rules.md` | ❌ |
| `openclaw.ts` | `OpenclawAdapter` | `~/.openclaw/openclaw.json` | `append-with-marker` → `AGENTS.md` | `.openclaw/skills/<n>/SKILL.md` |

For each adapter, mark unsupported asset types with `supported: false` and include a `reason` string.

---

## Step 7 — Implement Group-2 Host Adapters (2 files, TOML MCP)

| File | Class | MCP config | Prompt |
|------|-------|-----------|--------|
| `codex.ts` | `CodexAdapter` | `~/.codex/config.toml` (TOML table) | `append-with-marker` → `AGENTS.md` |
| `vibe.ts` | `VibeAdapter` | `.vibe/config.toml` (TOML array) | ❌ |

Set `configFile` to the `.toml` path; the TOML dispatch in `mcp.ts` (Step 5) handles the rest.

---

## Step 8 — Register All Adapters in `src/hosts/index.ts`

Import all 18 adapter classes and populate `hostRegistry`. Example:

```typescript
import { CursorAdapter } from './cursor.js';
import { WindsurfAdapter } from './windsurf.js';
// ... all 18

const hostRegistry: Map<string, HostAdapter> = new Map([
  ['cursor', new CursorAdapter()],
  ['windsurf', new WindsurfAdapter()],
  // ...
]);
```

---

## Step 9 — Explicit Flag Rejection in `src/installer.ts`

Add a `fromExplicitFlag: boolean` discriminator to the item objects built from CLI input (not from `--pack`). Before constructing `jobs[]`, iterate explicit-flag items and check `capability.supported`:

```typescript
if (!capability.supported && item.fromExplicitFlag) {
  // print error per contracts/cli-schema.md "Explicit asset flag + unsupported host"
  process.exit(2);
}
```

`--pack` items skip this check and continue to use the existing skip-and-summarize path.

---

## Step 10 — Create `src/hosts/README.md`

Write the canonical host capability matrix file. It must contain:

1. **Host Capability Matrix** table (all 18 hosts, all 5 asset types)
2. **Detailed Configuration** section per host (install path + official docs URL)
3. **Contribution Guide** — how to add a new host adapter

This file is committed to the repository and linked from error messages.

Content must be in **English** (committed file).

---

## Step 11 — Add / Update Tests

Unit tests:
- `tests/unit/hosts/<host-id>.test.ts` for each new adapter — verify `assets` declarations match expected paths and strategies
- `tests/unit/assets/prompt-create-file-in-dir.test.ts`
- `tests/unit/assets/mcp-toml.test.ts`

Integration tests:
- `tests/integration/hosts/windsurf.test.ts` — MCP + Prompt + Skill install
- `tests/integration/hosts/gemini.test.ts` — MCP + Prompt install
- `tests/integration/hosts/codex.test.ts` — TOML MCP install + idempotency
- `tests/integration/hosts/vibe.test.ts` — TOML MCP install + idempotency
- `tests/integration/installer-rejection.test.ts` — explicit flag → exit 2

---

## Step 12 — Update `package.json`

Remove `"src/hosts.json"` from the `files` array (the file is deleted). Ensure `smol-toml` is listed under `dependencies`.

---

## Validation Checklist

```
npm test           # all unit + integration tests pass
npm run lint       # tsc --noEmit, zero errors
```

Manually verify:
- [ ] `agent-get --mcp ./playwright.json --host windsurf` writes to `~/.codeium/windsurf/mcp_config.json`
- [ ] `agent-get --prompt ./rules.md --host roo-code` creates `.roo/rules/rules.md`
- [ ] `agent-get --command ./init.md --host windsurf` exits with code 2 and prints README link
- [ ] `agent-get --mcp ./playwright.json --host codex` writes TOML table `[mcp_servers.playwright]` to `~/.codex/config.toml`
- [ ] Re-running any of the above does not duplicate content
- [ ] `agent-get --pack ./pack.json --host gemini` (pack contains command) skips command without error
