import type { HostAdapter, AssetCapability, AssetType } from './types.js';

export class AmpAdapter implements HostAdapter {
  readonly id = 'amp';
  readonly displayName = 'Amp CLI';
  readonly detection = { paths: ['.amp/'] };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.amp/settings.json',
      configFileAlternatives: ['.amp/settings.jsonc'],
      configFormat: 'jsonc',
      configKey: 'amp.mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '.agents/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: false,
      reason: 'Amp has no verified standalone command-file discovery contract.',
    },
    subAgent: {
      supported: false,
      reason:
        'Amp built-in delegation is not a standalone sub-agent file contract.',
    },
  };
}
