import {
  HostId,
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

export class CursorAdapter implements HostAdapter {
  readonly id = HostId.Cursor;
  readonly selectionPriority = 1;
  readonly displayName = 'Cursor';
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

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at } = userPaths(environment);
    return {
      mcp: mcp(at('.cursor/mcp.json'), 'mcpServers', true),
      skill: skill(at('.cursor/skills')),
      subAgent: file(at('.cursor/agents')),
    };
  };
}
