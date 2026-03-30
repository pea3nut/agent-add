import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class TraeAdapter implements HostAdapter {
  readonly id = 'trae';
  readonly displayName = 'Trae';
  readonly docs = 'https://docs.trae.ai/ide/model-context-protocol';
  readonly detection = {
    paths: ['.trae/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.trae/mcp.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.trae/rules',
      writeStrategy: 'create-file-in-dir',
    },
    skill: NOT_SUPPORTED('Trae does not support project-level skill directories.'),
    command: NOT_SUPPORTED('Trae does not support custom slash commands via files.'),
    subAgent: NOT_SUPPORTED('Trae does not support sub-agent configuration files.'),
  };
}
