import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class OpencodeAdapter implements HostAdapter {
  readonly id = 'opencode';
  readonly displayName = 'opencode';
  readonly docs = 'https://opencode.ai/docs';
  readonly detection = {
    paths: ['opencode.json'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: 'opencode.json',
      configKey: 'mcp',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    skill: NOT_SUPPORTED('opencode does not support project-level skill directories.'),
    command: NOT_SUPPORTED('opencode does not support custom slash commands via files.'),
    subAgent: NOT_SUPPORTED('opencode does not support sub-agent configuration files.'),
  };
}
