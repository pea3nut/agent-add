import type { HostAdapter, AssetCapability, AssetType } from './types.js';

export class GooseAdapter implements HostAdapter {
  readonly id = 'goose';
  readonly displayName = 'goose';
  readonly detection = {
    paths: ['.goosehints', '.goose/'],
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
      installDir: '.agents/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: false,
      reason:
        'Use goose skills; recipes and custom slash commands require a separate verified format.',
    },
    subAgent: {
      supported: false,
      reason:
        'goose custom-agent/recipe registration is not a verified drop-in sub-agent contract.',
    },
  };
}
