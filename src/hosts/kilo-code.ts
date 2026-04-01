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
    skill: {
      supported: true,
      installDir: '.kilocode/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.kilocode/commands/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
    subAgent: {
      supported: true,
      installDir: '.kilocode/agents/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
  };
}
