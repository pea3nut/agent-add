import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class ClaudeCodeAdapter implements HostAdapter {
  readonly id = 'claude-code';
  readonly displayName = 'Claude Code';
  readonly docs = 'https://code.claude.com/docs/en';
  readonly detection = {
    paths: ['.claude/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.mcp.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    skill: {
      supported: true,
      installDir: '.claude/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    prompt: {
      supported: true,
      targetFile: 'CLAUDE.md',
      writeStrategy: 'append-with-marker',
    },
    command: {
      supported: true,
      installDir: '.claude/commands/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
    subAgent: {
      supported: true,
      installDir: '.claude/agents/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
  };
}
