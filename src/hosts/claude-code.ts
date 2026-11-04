import path from 'path';
import {
  HostId,
  type HostAdapter,
  type AssetCapability,
  type AssetType,
  type UserEnvironment,
  type UserAssets,
} from './types.js';
import { skill, file, prompt, mcp, userPaths } from './user-assets.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class ClaudeCodeAdapter implements HostAdapter {
  readonly id = HostId.ClaudeCode;
  readonly displayName = 'Claude Code';
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

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { env } = environment;
    const { at, override, reject } = userPaths(environment);
    const root = override('CLAUDE_CONFIG_DIR', at('.claude'));
    return {
      mcp: env.CLAUDE_CONFIG_DIR ? reject('CLAUDE_CONFIG_DIR for MCP') : mcp(at('.claude.json')),
      prompt: prompt(path.join(root, 'CLAUDE.md')),
      skill: skill(path.join(root, 'skills')),
      command: file(path.join(root, 'commands')),
      subAgent: file(path.join(root, 'agents')),
    };
  };
}
