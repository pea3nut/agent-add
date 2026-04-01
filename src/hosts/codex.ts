import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class CodexAdapter implements HostAdapter {
  readonly id = 'codex';
  readonly displayName = 'Codex CLI';
  readonly docs = 'https://github.com/openai/codex';
  readonly detection = {
    paths: ['~/.codex/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: {
        darwin: '~/.codex/config.toml',
        linux: '~/.codex/config.toml',
        win32: '%USERPROFILE%\\.codex\\config.toml',
      },
      configKey: 'mcp_servers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '.codex/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: NOT_SUPPORTED('Codex CLI does not support custom slash commands via files.'),
    subAgent: {
      supported: true,
      installDir: '.codex/agents/',
      fileExtension: '.toml',
      writeStrategy: 'copy-file',
    },
  };
}
