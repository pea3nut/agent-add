import type { HostAdapter, AssetCapability, AssetType } from './types.js';

export class ClaudeDesktopAdapter implements HostAdapter {
  readonly id = 'claude-desktop';
  readonly displayName = 'Claude Desktop';
  readonly docs = 'https://modelcontextprotocol.io/quickstart/user';
  readonly detection = {
    paths: {
      darwin: '~/Library/Application Support/Claude/',
      win32: '%APPDATA%\\Claude\\',
      linux: '~/.config/Claude/',
    },
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: {
        darwin: '~/Library/Application Support/Claude/claude_desktop_config.json',
        win32: '%APPDATA%\\Claude\\claude_desktop_config.json',
        linux: '~/.config/Claude/claude_desktop_config.json',
      },
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    skill: {
      supported: false,
      reason: 'Claude Desktop is a UI-based chat application and does not support project-level skill files.',
    },
    prompt: {
      supported: false,
      reason: 'Claude Desktop is a UI-based chat application and does not support project-level rules or memory files.',
    },
    command: {
      supported: false,
      reason: 'Claude Desktop is a UI-based chat application and does not support custom slash commands.',
    },
    subAgent: {
      supported: false,
      reason: 'Claude Desktop is a UI-based chat application and does not support sub-agent configuration files.',
    },
  };
}
