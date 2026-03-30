import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class KiloCodeAdapter implements HostAdapter {
  readonly id = 'kilo-code';
  readonly displayName = 'Kilo Code';
  readonly docs = 'https://kilo.ai/docs/automate/mcp/using-in-kilo-code';
  readonly detection = {
    paths: ['.kilocode/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.kilocode/mcp.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.kilocode/rules',
      writeStrategy: 'create-file-in-dir',
    },
    skill: NOT_SUPPORTED('Kilo Code does not support project-level skill directories.'),
    command: NOT_SUPPORTED('Kilo Code does not support custom slash commands via files.'),
    subAgent: NOT_SUPPORTED('Kilo Code does not support sub-agent configuration files.'),
  };
}
