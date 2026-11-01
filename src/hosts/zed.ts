import type { HostAdapter, AssetCapability, AssetType } from './types.js';

export class ZedAdapter implements HostAdapter {
  readonly id = 'zed';
  readonly displayName = 'Zed Agent';
  readonly docs = 'https://zed.dev/docs/ai/mcp';
  readonly detection = { paths: ['.zed/', '~/.config/zed/'] };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: {
        darwin: '~/.config/zed/settings.json',
        linux: '~/.config/zed/settings.json',
        win32: '%APPDATA%/Zed/settings.json',
      },
      configFormat: 'jsonc',
      configKey: 'context_servers',
      mcpFormat: 'zed',
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
        'Use Zed skills for slash commands; no independent command-file target is verified.',
    },
    subAgent: {
      supported: false,
      reason:
        'External agents and profiles do not define a Zed sub-agent asset-file format.',
    },
  };
}
