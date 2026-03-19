# Implementation Plan: Scenario Tests 测试体系

**Branch**: `003-scenario-tests` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-scenario-tests/spec.md`

---

## Summary

Add a Gherkin Scenario Test layer on top of the existing vitest suite, covering 6 core asset types × 3 hosts (Cursor, Claude Code, Claude Desktop), executed by AI `scenario-case-runner` via `/tns:exec-scenarios`. The only production source change is a minimal one-line guard in `src/assets/mcp.ts` to support the `AGENT_GET_HOME` environment variable for test isolation. All other deliverables are new `.feature` files, fixture files, and a pre-committed `scenario-run-config.md`.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18 (CommonJS)  
**Primary Dependencies**: No new dependencies. Existing: `commander`, `yaml`, `zod`, `@inquirer/select`. Dev: `vitest`, `tsup`, `typescript`.  
**Storage**: File system only — `.feature` files, fixture files, `scenario-run-config.md`  
**Testing**: Gherkin `.feature` files executed manually by AI `scenario-case-runner` agent via `/tns:exec-scenarios` command; bash-shell executor; no framework changes  
**Target Platform**: macOS (primary), Linux (compatible); Claude Desktop scenarios macOS-only  
**Project Type**: CLI tool  
**Performance Goals**: N/A (test infrastructure; no runtime performance requirement)  
**Constraints**: CLI must be pre-built (`npm run build`) before test execution; no new npm dependencies; existing vitest suite must remain untouched  
**Scale/Scope**: ~10 feature files, ~50 scenarios, 7 fixture sources

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No `.specify/memory/constitution.md` found in the repository. Skipping gate check — no violations to evaluate. All design decisions below adhere to the stated project constraints:

- ✅ No new npm dependencies introduced  
- ✅ Existing `tests/unit/` and `tests/contract/` vitest files unchanged  
- ✅ `package.json` scripts (`test`, `test:contract`, `test:integration`) unchanged  
- ✅ Source code change is minimal: one helper function in `src/assets/mcp.ts`  
- ✅ All committed test/config files written in English (per user directive)

*Post-Phase 1 re-check: same result — no violations.*

---

## Project Structure

### Documentation (this feature)

```text
specs/003-scenario-tests/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   ├── scenario-run-config-schema.md   ← Phase 1 output
│   └── fixture-formats.md              ← Phase 1 output
└── tasks.md             ← Phase 2 output (created by /speckit.tasks, NOT here)
```

### Source Code (repository root)

```text
src/
└── assets/
    └── mcp.ts                  # MODIFIED: add AGENT_GET_HOME guard (~3 lines)

tests/
├── features/
│   ├── scenario-run-config.md  # NEW: pre-committed bash-shell run config
│   ├── core/
│   │   ├── cli-basic.feature   # NEW: --version / --help
│   │   ├── mcp.feature         # NEW: MCP install + idempotency
│   │   ├── skill.feature       # NEW: Skill install + idempotency
│   │   ├── prompt.feature      # NEW: Prompt install + idempotency
│   │   ├── command.feature     # NEW: Command install + idempotency
│   │   ├── sub-agent.feature   # NEW: Sub-agent install + idempotency
│   │   └── pack.feature        # NEW: Pack install + idempotency
│   └── host/
│       ├── cursor.feature      # NEW: Cursor basic install (all assets)
│       ├── claude-code.feature # NEW: Claude Code basic install (all assets)
│       └── claude-desktop.feature  # NEW: Claude Desktop MCP install (macOS)
└── fixtures/
    ├── mcp/
    │   └── playwright.json         # Valid MCP JSON (command + args)
    ├── skill/
    │   ├── my-skill/
    │   │   └── SKILL.md            # Valid skill (has SKILL.md entry point)
    │   └── bad-skill/
    │       └── README.md           # Invalid skill (no SKILL.md)
    ├── prompt/
    │   └── my-prompt.md            # Prompt markdown content
    ├── command/
    │   └── my-command.md           # Command markdown content
    ├── sub-agent/
    │   └── my-agent.md             # Sub-agent with agent-get/* frontmatter fields
    └── pack/
        └── manifest.json           # Pack manifest (all 6 asset types)
```

**Structure Decision**: Single project layout; test files added under `tests/features/` alongside existing `tests/unit/` and `tests/contract/`. Fixtures go to `tests/fixtures/` as a new sibling directory. No restructuring of existing directories.

---

## Complexity Tracking

> No Constitution violations detected — this section is not applicable.
