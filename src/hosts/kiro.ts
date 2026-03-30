import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class KiroAdapter implements HostAdapter {
  readonly id = 'kiro';
  readonly displayName = 'Kiro CLI';
  readonly docs = 'https://kiro.dev/docs/mcp/';
  readonly detection = {
    paths: ['.kiro/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.kiro/settings/mcp.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.kiro/steering',
      writeStrategy: 'create-file-in-dir',
    },
    skill: NOT_SUPPORTED('Kiro does not support project-level skill directories.'),
    command: NOT_SUPPORTED('Kiro does not support custom slash commands via files.'),
    subAgent: NOT_SUPPORTED('Kiro does not support sub-agent configuration files.'),
  };
}
