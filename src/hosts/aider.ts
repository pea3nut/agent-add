import type { HostAdapter, AssetCapability, AssetType } from './types.js';

export class AiderAdapter implements HostAdapter {
  readonly id = 'aider';
  readonly displayName = 'Aider';
  readonly detection = { paths: ['.aider.conf.yml'] };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: false,
      reason:
        'No native Aider MCP configuration contract is verified; third-party bridges are not this adapter.',
    },
    prompt: {
      supported: true,
      targetFile: 'CONVENTIONS.md',
      configFile: '.aider.conf.yml',
      registration: 'read',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: false,
      reason:
        'Aider read-only chat files are not a Skill directory discovery protocol.',
    },
    command: {
      supported: false,
      reason:
        'Aider built-in slash commands do not define custom command-file discovery.',
    },
    subAgent: {
      supported: false,
      reason: 'No native Aider sub-agent file contract is verified.',
    },
  };
}
