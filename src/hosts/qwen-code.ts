import { geminiMcp } from './mcp.js';
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
import { skill, file, mcp, userPaths } from './user-assets.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class QwenCodeAdapter implements HostAdapter {
  readonly id = HostId.QwenCode;
  readonly selectionPriority = 4;
  readonly displayName = 'Qwen Code';
  readonly detection = {
    paths: ['.qwen/'],
  };
  readonly mcp: McpAdapter = {
    normalizeUrl: (url) => url.replace(/\$\{[A-Za-z_][A-Za-z0-9_]*\}/g, '1'),
    convert: (input) => geminiMcp(input, this.id),
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

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at, override } = userPaths(environment);
    const root = override('QWEN_HOME', at('.qwen'));
    return {
      mcp: mcp(path.join(root, 'settings.json'), 'mcpServers', true),
      skill: skill(path.join(root, 'skills')),
      command: file(path.join(root, 'commands')),
      subAgent: file(path.join(root, 'agents')),
    };
  };
}
