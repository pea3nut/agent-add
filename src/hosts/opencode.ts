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
    skill: {
      supported: true,
      installDir: '.opencode/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.opencode/commands/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
    subAgent: {
      supported: true,
      installDir: '.opencode/agents/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
  };
}
