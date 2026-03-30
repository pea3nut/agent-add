import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class TabnineAdapter implements HostAdapter {
  readonly id = 'tabnine';
  readonly displayName = 'Tabnine CLI';
  readonly docs = 'https://docs.tabnine.com/main/getting-started/tabnine-agent/guidelines';
  readonly detection = {
    paths: ['.tabnine/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.tabnine/mcp_servers.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.tabnine/guidelines',
      writeStrategy: 'create-file-in-dir',
    },
    skill: NOT_SUPPORTED('Tabnine CLI does not support project-level skill directories.'),
    command: NOT_SUPPORTED('Tabnine CLI does not support custom slash commands via files.'),
    subAgent: NOT_SUPPORTED('Tabnine CLI does not support sub-agent configuration files.'),
  };
}
