import path from 'path';
import {
  HostId,
  type McpAdapter,
  type HostAdapter,
  type AssetCapability,
  type AssetType,
  type UserEnvironment,
  type UserAssets,
} from './types.js';
import { unsupported, mcp, userPaths } from './user-assets.js';

export class ClaudeDesktopAdapter implements HostAdapter {
  readonly id = HostId.ClaudeDesktop;
  readonly displayName = 'Claude Desktop';
  readonly detection = {
    paths: [],
  };
  readonly mcp: McpAdapter = {
    validateSource: (source) => {
      if (source.url !== undefined || source.httpUrl !== undefined || source.serverUrl !== undefined)
        throw new Error('Claude Desktop file installation supports local stdio MCP servers only');
    },
    convert: ({ source, command, args, env }) => {
      if (typeof command !== 'string')
        throw new Error('Claude Desktop requires a string stdio command');
      const allowed = new Set(['command', 'args', 'env', 'environment', 'type', 'transport']);
      for (const key of Object.keys(source))
        if (!allowed.has(key)) throw new Error('Claude Desktop cannot represent MCP field ' + key);
      return {
        command,
        ...(args !== undefined ? { args } : {}),
        ...(env !== undefined ? { env } : {}),
      };
    },
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

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { env, platform } = environment;
    const { at, override } = userPaths(environment);
    if (platform === 'darwin') {
      return {
        mcp: mcp(at('Library/Application Support/Claude/claude_desktop_config.json')),
      };
    }
    if (platform === 'win32' && env.APPDATA) {
      return {
        mcp: mcp(path.join(override('APPDATA', ''), 'Claude/claude_desktop_config.json')),
      };
    }
    return {
      mcp: unsupported('Claude Desktop user MCP requires macOS or Windows with APPDATA; no verified target exists for this platform.'),
    };
  };
}
