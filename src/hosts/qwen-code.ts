import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class QwenCodeAdapter implements HostAdapter {
  readonly id = 'qwen-code';
  readonly displayName = 'Qwen Code';
  readonly docs = 'https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/';
  readonly detection = {
    paths: ['.qwen/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.qwen/settings.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '.qwen/skills',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.qwen/commands/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
    subAgent: {
      supported: true,
      installDir: '.qwen/agents/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
  };
}
