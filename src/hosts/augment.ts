import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class AugmentAdapter implements HostAdapter {
  readonly id = 'augment';
  readonly displayName = 'Augment';
  readonly detection = {
    paths: ['.augment/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.augment/settings.json',
      configKey: 'mcpServers',
      configFormat: 'jsonc',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.augment/rules',
      writeStrategy: 'create-file-in-dir',
    },
    skill: {
      supported: true,
      installDir: '.augment/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.augment/commands/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
    subAgent: {
      supported: true,
      installDir: '.augment/agents/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
  };
}
