# Quickstart: agent-get CLI Development

**Branch**: `001-agent-pack-installer` | **Date**: 2026-03-17

---

## Prerequisites

- Node.js ≥ 18
- Git (for resolving Git-based sources)
- npm ≥ 9

---

## Setup

```bash
# Clone & install
git clone git@github.com:pea3nut/agent-get.git
cd agent-get
npm install
```

---

## Project Structure

```
agent-get/
├── bin/
│   └── agent-get.js          # CLI entry point (shebang → dist/index.js)
├── src/
│   ├── index.ts              # Main entry, wires CLI → installer
│   ├── cli.ts                # Commander setup & flag parsing
│   ├── installer.ts          # Installation orchestration
│   ├── hosts.json            # Static host capability matrix
│   ├── hosts/
│   │   ├── index.ts          # Host registry & detection
│   │   ├── types.ts          # HostConfig, AssetCapability interfaces
│   │   ├── cursor.ts         # Cursor-specific path resolution
│   │   ├── claude-code.ts    # Claude Code-specific path resolution
│   │   └── claude-desktop.ts # Claude Desktop-specific path resolution
│   ├── assets/
│   │   ├── types.ts          # AssetHandler interface
│   │   ├── mcp.ts            # MCP: inject into mcpServers JSON
│   │   ├── skill.ts          # Skill: copy directory to installDir
│   │   ├── prompt.ts         # Prompt: append marker block to target file
│   │   ├── command.ts        # Command: copy .md to commands dir
│   │   └── sub-agent.ts      # SubAgent: copy & apply agent-get/* hints
│   ├── source/
│   │   ├── index.ts          # SourceResolver: detect URI type & resolve
│   │   ├── local.ts          # Local path resolver
│   │   └── git.ts            # Git sparse checkout resolver
│   ├── manifest/
│   │   ├── parser.ts         # Parse & validate Manifest JSON (zod)
│   │   └── schema.ts         # Zod schema + TypeScript types
│   └── utils/
│       ├── fs.ts             # atomicWriteJSON, readJSON, ensureDir
│       ├── detect-hosts.ts   # Scan CWD for host feature paths
│       └── summary.ts        # Format & print InstallSummary
├── tests/
│   ├── unit/
│   │   ├── manifest/         # Zod schema validation tests
│   │   ├── source/           # URI detection & name inference tests
│   │   └── utils/            # atomicWriteJSON, marker block tests
│   ├── integration/
│   │   ├── cursor/           # Full install flow against tmp dirs
│   │   ├── claude-code/
│   │   └── claude-desktop/
│   └── contract/
│       └── cli.test.ts       # --help snapshot, exit codes, summary format
├── specs/
│   └── 001-agent-pack-installer/  # Feature specification & plan artifacts
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

---

## Development Commands

```bash
# Build (TypeScript → dist/)
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Run contract tests only
npm run test:contract

# Run integration tests (requires git, writes to tmp dirs)
npm run test:integration

# Link CLI locally for manual testing
npm link
agent-get --help
```

---

## Key Files to Start With

### 1. `src/manifest/schema.ts` — Zod schema

```typescript
import { z } from 'zod';

const AssetTypeEnum = z.enum(['mcp', 'skill', 'prompt', 'command', 'subAgent']);

export const AssetDescriptorSchema = z.object({
  type: AssetTypeEnum,
  name: z.string().regex(/^[a-zA-Z0-9_-]+$/).min(1),
  source: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
});

export const ManifestSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/),
  assets: z.array(AssetDescriptorSchema).min(1),
});

export type AssetType = z.infer<typeof AssetTypeEnum>;
export type AssetDescriptor = z.infer<typeof AssetDescriptorSchema>;
export type Manifest = z.infer<typeof ManifestSchema>;
```

### 2. `src/utils/fs.ts` — Atomic JSON write

```typescript
import fs from 'fs';
import path from 'path';

export function atomicWriteJSON(filePath: string, obj: unknown): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.tmp`);
  fs.writeFileSync(tmpPath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  fs.renameSync(tmpPath, filePath);
}

export function readJSONOrNull<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}
```

### 3. `src/source/index.ts` — URI detection

```typescript
export type SourceType = 'local' | 'git-ssh' | 'git-https' | 'http-file';

export function detectSourceType(source: string): SourceType {
  if (source.startsWith('git@')) return 'git-ssh';
  if (source.startsWith('https://') || source.startsWith('http://')) {
    // git-https: contains .git or has a #path fragment
    if (source.includes('.git') || source.includes('#')) return 'git-https';
    return 'http-file'; // direct single-file URL
  }
  return 'local';
}

export function parseGitSource(source: string): { repoUrl: string; subPath?: string } {
  const [repoUrl, subPath] = source.split('#');
  return { repoUrl, subPath };
}
```

### 4. `src/source/infer-name.ts` — Asset name inference

```typescript
import path from 'path';

export function inferName(source: string): string {
  // Git URL with #path: use last segment of the path
  if (source.includes('#')) {
    const fragment = source.split('#')[1];
    return path.basename(fragment, path.extname(fragment));
  }
  // Git SSH/HTTPS without #path: use repo name (strip .git)
  if (source.startsWith('git@') || (source.includes('.git') && !source.includes('#'))) {
    const repoName = source.split('/').pop()?.replace(/\.git$/, '') ?? 'asset';
    return repoName;
  }
  // HTTP(S) direct URL or local path: use filename without extension
  return path.basename(source, path.extname(source));
}
```

---

## Manual Testing Scenarios

### Scenario 1: Install a single MCP (local)

```bash
# Create test fixture
mkdir -p /tmp/test-project/.cursor
echo '{"command": "npx", "args": ["-y", "@playwright/mcp"]}' > /tmp/test-mcp.json

cd /tmp/test-project
agent-get --mcp /tmp/test-mcp.json --host cursor

# Expected: .cursor/mcp.json created with mcpServers.test-mcp
cat .cursor/mcp.json
```

### Scenario 2: Idempotency check

```bash
cd /tmp/test-project
agent-get --mcp /tmp/test-mcp.json --host cursor  # second run
# Expected: "≡ exists" status in summary, no duplicate entry
```

### Scenario 3: Install a full Pack

```bash
cat > /tmp/agent-pack.json << 'EOF'
{
  "name": "test/demo-pack",
  "assets": [
    {"type": "mcp", "name": "playwright", "source": "/tmp/test-mcp.json"}
  ]
}
EOF

agent-get --pack /tmp/agent-pack.json --host cursor
```

### Scenario 4: No --host (interactive)

```bash
cd /tmp/test-project  # has .cursor/ directory
agent-get --mcp /tmp/test-mcp.json
# Expected: interactive list appears with "cursor" pre-selected (detected)
```

### Scenario 5: Non-TTY without --host (CI simulation)

```bash
# Simulate non-TTY pipe to verify error behavior
echo "" | agent-get --mcp /tmp/test-mcp.json
# Expected: exit 2, stderr:
#   "agent-get error: Non-interactive environment detected. Please specify a host with --host <host>."
```

### Scenario 6: Skill source missing SKILL.md

```bash
mkdir -p /tmp/invalid-skill/
# (no SKILL.md inside)
agent-get --skill /tmp/invalid-skill --host cursor
# Expected: exit 2, stderr:
#   "agent-get error: Skill source at /tmp/invalid-skill does not contain SKILL.md"
```

---

## Adding a New Host

1. Add host entry to `src/hosts.json` with asset capabilities and paths
2. Create `src/hosts/<host-id>.ts` for any host-specific path resolution logic
3. Add host detection path to `detection.paths` in `hosts.json`
4. Add integration tests in `tests/integration/<host-id>/`
5. Update `--host` valid values in CLI contract (`contracts/cli-contract.md`)
