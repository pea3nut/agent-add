import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class VibeAdapter implements HostAdapter {
  readonly id = 'vibe';
  readonly displayName = 'Mistral Vibe';
  readonly docs = 'https://docs.mistral.ai/mistral-vibe/introduction/configuration';
  readonly detection = {
    paths: ['.vibe/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.vibe/config.toml',
      writeStrategy: 'inject-json-key',
    },
    prompt: NOT_SUPPORTED('Mistral Vibe does not support project-level rules or prompt files.'),
    skill: NOT_SUPPORTED('Mistral Vibe does not support project-level skill directories.'),
    command: NOT_SUPPORTED('Mistral Vibe does not support custom slash commands via files.'),
    subAgent: NOT_SUPPORTED('Mistral Vibe does not support sub-agent configuration files.'),
  };
}
