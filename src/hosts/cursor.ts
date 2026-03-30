import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class CursorAdapter implements HostAdapter {
  readonly id = 'cursor';
  readonly displayName = 'Cursor';
  readonly docs = 'https://cursor.com/docs';
  readonly detection = {
    paths: ['.cursor/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.cursor/mcp.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    skill: {
      supported: true,
      installDir: '.cursor/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    command: {
      supported: true,
      installDir: '.cursor/commands/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
    subAgent: {
      supported: true,
      installDir: '.cursor/agents/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
  };
}
