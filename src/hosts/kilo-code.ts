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
    paths: ['.kilo/', 'kilo.jsonc', 'kilo.json', '.kilocode/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: 'kilo.jsonc',
      configFileAlternatives: [
        'kilo.json',
        '.kilo/kilo.jsonc',
        '.kilo/kilo.json',
      ],
      configKey: 'mcp',
      configFormat: 'jsonc',
      mcpFormat: 'opencode',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.kilo/rules',
      registration: 'instructions',
      writeStrategy: 'create-file-in-dir',
    },
    skill: {
      supported: true,
      installDir: '.kilo/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.kilo/commands/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
    subAgent: {
      supported: true,
      installDir: '.kilo/agents/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
  };
}
