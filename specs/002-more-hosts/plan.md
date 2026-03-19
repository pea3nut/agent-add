# Implementation Plan: Expand Host Support (002-more-hosts)

**Branch**: `002-more-hosts` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/002-more-hosts/spec.md`

---

## Summary

Expand `agent-get` from 3 hosts to 18 hosts (13 Group-1 + 2 Group-2) by migrating from a static `hosts.json` data file to a TypeScript Adapter class pattern (`HostAdapter` interface per host). Adds a new `create-file-in-dir` write strategy, TOML MCP write support for Codex CLI and Mistral Vibe, explicit CLI flag rejection (exit 2) when a host does not support the requested asset type, and `src/hosts/README.md` as the canonical host capability matrix.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js ≥ 18 (CommonJS / tsup bundler)  
**Primary Dependencies**: commander, yaml, zod (existing) + `smol-toml` (new, for TOML read/write)  
**Storage**: File system only — no database, no install-state file  
**Testing**: vitest (unit + integration suites already wired)  
**Target Platform**: macOS / Linux / Windows, CLI tool distributed via npm  
**Project Type**: CLI tool (library-style core + thin CLI entry point)  
**Performance Goals**: N/A (file I/O bound, no latency targets)  
**Constraints**: Zero extra runtime deps beyond what is listed above; each Adapter class must be self-contained and not import shared TOML/JSON write helpers for its own config format  
**Scale/Scope**: 18 host adapters, ~15 new source files; no user-facing database changes

---

## Constitution Check

*No `.specify/memory/constitution.md` found in this repo — skipping gated constitution checks.*

---

## Project Structure

### Documentation (this feature)

```text
specs/002-more-hosts/
├── plan.md              ← This file
├── research.md          ← Phase 0 (already complete)
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
└── contracts/
    └── cli-schema.md    ← Phase 1 output
```

### Source Code (repository root)

```text
src/
├── hosts/
│   ├── types.ts              ← HostAdapter interface + extended AssetCapability
│   ├── index.ts              ← hostId → HostAdapter registry (replaces hosts.json reference)
│   ├── README.md             ← Canonical host capability matrix (new)
│   │   [existing adapters]
│   ├── cursor.ts             ← CursorAdapter implements HostAdapter
│   ├── claude-code.ts        ← ClaudeCodeAdapter implements HostAdapter
│   ├── claude-desktop.ts     ← ClaudeDesktopAdapter implements HostAdapter
│   │   [Group-1 new adapters — 13 files]
│   ├── windsurf.ts
│   ├── github-copilot.ts
│   ├── gemini.ts
│   ├── roo-code.ts
│   ├── kilo-code.ts
│   ├── qwen-code.ts
│   ├── opencode.ts
│   ├── augment.ts
│   ├── kiro.ts
│   ├── tabnine.ts
│   ├── kimi.ts
│   ├── trae.ts
│   ├── openclaw.ts
│   │   [Group-2 new adapters — 2 files, TOML MCP]
│   ├── codex.ts
│   └── vibe.ts
├── assets/
│   ├── mcp.ts               ← extend to dispatch TOML write for .toml config files
│   └── prompt.ts            ← extend to support create-file-in-dir strategy
├── hosts.json               ← DELETED in this feature
└── installer.ts             ← extend: reject explicit flag + unsupported host (exit 2)

tests/
├── unit/
│   ├── hosts/               ← per-adapter capability declarations
│   └── assets/              ← create-file-in-dir + TOML write unit tests
└── integration/
    └── hosts/               ← end-to-end install scenarios for new hosts
```

**Structure Decision**: Single-project layout (existing `src/` + `tests/`). Each new host gets one file under `src/hosts/`. No new top-level directories needed.

---

## Phase 0: Research

> **Status: Complete** — See [research.md](./research.md).

All NEEDS CLARIFICATION items resolved:

| Decision | Outcome | Reference |
|----------|---------|-----------|
| Qwen Code Prompt path | `AGENTS.md` (append-with-marker) | spec clarification §Session 2026-03-17 |
| Tabnine CLI Prompt path | `.tabnine/guidelines/<name>.md` (create-file-in-dir) | spec clarification |
| Kimi Code Prompt path | `AGENTS.md` (append-with-marker) | spec clarification |
| `reason` field fallback | `"This asset type is not supported by this host."` | spec FR-105 |
| Architecture: hosts.json vs Adapter classes | Full Adapter class pattern, hosts.json deleted | spec clarification |
| TOML library choice | `smol-toml` — zero-dep, 100% TOML 1.0, ~4 KB minzipped | research |
| Amp MCP | Deferred (no fixed config file path) | spec Assumptions |

---

## Phase 1: Design & Contracts

### 1.1 Architecture Overview

```
CLI input (commander)
        │
        ▼
  installer.ts  ──── validates explicit flags against host capability ────► exit 2
        │
        ▼
  Asset Handlers (mcp / skill / prompt / command / sub-agent)
        │                         │
   JSON path               TOML path (detect by .toml extension)
        │                         │
   inject-json-key           CodexAdapter.writeMcp() / VibeAdapter.writeMcp()
        │
   create-file-in-dir  ─── new branch in prompt.ts
```

Key invariants:
- `installer.ts` is the **only** place that checks `capability.supported` for explicit flags (exit 2)
- `--pack` flow continues to use the existing skip-and-summarize path
- Each Adapter class is **self-contained**: no shared TOML util, no shared config-format field

### 1.2 `HostAdapter` Interface Changes

`src/hosts/types.ts` changes:
1. Rename `HostConfig` → `HostAdapter` (or keep `HostConfig` as a type alias for backward compat with internal callers during migration)
2. Add `'create-file-in-dir'` to `AssetCapability.writeStrategy` union
3. Keep all existing fields; no breaking changes

### 1.3 New Write Strategy: `create-file-in-dir`

Implemented in `src/assets/prompt.ts`:

```
if (capability.writeStrategy === 'create-file-in-dir') {
  dir  = resolve(cwd, capability.installDir)
  file = join(dir, `${assetName}.md`)
  mkdirSync(dir, { recursive: true })
  if (exists(file) && !force) → return { status: 'skipped' }
  writeFileSync(file, content)
  return { status: 'installed', path: file }
}
```

### 1.4 TOML MCP Write (Codex + Vibe)

Detection: `capability.configFile` ends with `.toml` → dispatch to adapter's own `writeMcp()` instead of shared `inject-json-key`.

`CodexAdapter.writeMcp(name, config, tomlPath)`:
- Parse existing TOML (or start from `{}`)
- Set `mcp_servers[name] = { command, args, env? }` (table section)
- Serialize back with `smol-toml` and write atomically
- Idempotent: skip if key already present

`VibeAdapter.writeMcp(name, config, tomlPath)`:
- Parse existing TOML (or start from `{}`)
- Check `mcp_servers` array for existing entry with same `name` → skip if found
- Append new `{ name, transport: "stdio", command, args }` entry
- Serialize back and write atomically

### 1.5 Explicit Flag Rejection (installer.ts)

New logic inserted **before** building `jobs[]`, applied only to assets that came from explicit CLI flags (not `--pack`):

```
for explicit flag item:
  if capability.supported === false:
    print error (host name, asset type, reason, README link, PR link)
    exit(2)
```

Multi-host note: spec §Assumptions states multi-host (`--host a --host b`) is out of scope for this feature (single-host only). No multi-host rejection logic needed.

### 1.6 `src/hosts/README.md` Structure

Sections (all English, committed to repo):

1. **Host Capability Matrix** — table: host display name | id | MCP | Prompt | Skill | Command | Sub-agent
2. **Detailed Configuration per Host** — one sub-section per host with install path and official docs link
3. **How to Add a New Host (Contribution Guide)** — step-by-step: create `src/hosts/<id>.ts`, register in `index.ts`, update README, add tests

---

## Phase 1 Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Data Model | `specs/002-more-hosts/data-model.md` | Generated |
| CLI Contract | `specs/002-more-hosts/contracts/cli-schema.md` | Generated |
| Quickstart | `specs/002-more-hosts/quickstart.md` | Generated |
| Agent Context | `.cursor/rules/specify-rules.mdc` | Updated |

---

## Complexity Tracking

No constitution violations identified.
