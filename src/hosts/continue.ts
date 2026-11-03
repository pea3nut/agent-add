import type { HostAdapter, AssetCapability, AssetType } from './types.js';

export class ContinueAdapter implements HostAdapter {
  readonly id = 'continue';
  readonly displayName = 'Continue';
  readonly docs = 'https://docs.continue.dev/customize/deep-dives/mcp';
  readonly detection = { paths: ['.continue/'] };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.continue/mcpServers/agent-add.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.continue/rules/',
      writeStrategy: 'create-file-in-dir',
    },
    skill: {
      supported: false,
      reason:
        'A directory-bundle Skill discovery contract is not verified for this Continue target.',
    },
    command: {
      supported: false,
      reason:
        'Continue rules/prompts are not a separately verified Command asset format.',
    },
    subAgent: {
      supported: false,
      reason: 'No standalone Continue sub-agent file contract is verified.',
    },
  };
}
