import type { HostAdapter, AssetCapability, AssetType } from './types.js';

export class ClaudeDesktopAdapter implements HostAdapter {
  readonly id = 'claude-desktop';
  readonly displayName = 'Claude Desktop';
  readonly detection = {
    paths: [],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: false,
      reason: 'No verified project-level MCP configuration target is supported.',
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
