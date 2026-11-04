import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class KimiAdapter implements HostAdapter {
  readonly id = 'kimi';
  readonly displayName = 'Kimi Code';
  readonly detection = {
    paths: ['.kimi/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: false,
      reason: 'No verified project-level MCP configuration target is supported.',
    },
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '.kimi/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: NOT_SUPPORTED(
      'Kimi Code does not support custom slash commands via files.',
    ),
    subAgent: NOT_SUPPORTED(
      'Kimi subagents require YAML definitions, parent registration and --agent-file selection; automatic installation is not implemented.',
    ),
  };
}
