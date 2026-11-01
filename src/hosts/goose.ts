import type { HostAdapter, AssetCapability, AssetType } from './types.js';

export class GooseAdapter implements HostAdapter {
  readonly id = 'goose';
  readonly displayName = 'goose';
  readonly docs = 'https://goose-docs.ai/docs/guides/config-files/';
  readonly detection = {
    paths: ['.goosehints', '.goose/', '~/.config/goose/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: {
        darwin: '~/.config/goose/config.yaml',
        linux: '~/.config/goose/config.yaml',
        win32: '%APPDATA%/Block/goose/config/config.yaml',
      },
      configKey: 'extensions',
      configFormat: 'yaml',
      mcpFormat: 'goose',
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
      reason:
        'Use goose skills; recipes and custom slash commands require a separate verified format.',
    },
    subAgent: {
      supported: false,
      reason:
        'goose custom-agent/recipe registration is not a verified drop-in sub-agent contract.',
    },
  };
}
