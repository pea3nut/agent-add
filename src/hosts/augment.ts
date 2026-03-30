import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class AugmentAdapter implements HostAdapter {
  readonly id = 'augment';
  readonly displayName = 'Augment';
  readonly docs = 'https://docs.augmentcode.com/setup-augment/mcp';
  readonly detection = {
    paths: ['~/.augment/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: {
        darwin: '~/.augment/settings.json',
        linux: '~/.augment/settings.json',
        win32: '%USERPROFILE%\\.augment\\settings.json',
      },
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.augment/rules',
      writeStrategy: 'create-file-in-dir',
    },
    skill: NOT_SUPPORTED('Augment does not support project-level skill directories.'),
    command: NOT_SUPPORTED('Augment does not support custom slash commands via files.'),
    subAgent: NOT_SUPPORTED('Augment does not support sub-agent configuration files.'),
  };
}
