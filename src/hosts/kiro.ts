import {
  HostId,
  type HostAdapter,
  type AssetCapability,
  type AssetType,
  type UserEnvironment,
  type UserAssets,
} from './types.js';
import { skill, file, rules, mcp, userPaths } from './user-assets.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class KiroAdapter implements HostAdapter {
  readonly id = HostId.Kiro;
  readonly displayName = 'Kiro CLI';
  readonly detection = {
    paths: ['.kiro/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.kiro/settings/mcp.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.kiro/steering',
      writeStrategy: 'create-file-in-dir',
    },
    skill: {
      supported: true,
      installDir: '.kiro/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: NOT_SUPPORTED('Kiro does not support custom slash commands via files.'),
    subAgent: {
      supported: true,
      installDir: '.kiro/agents/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at } = userPaths(environment);
    return {
      mcp: mcp(at('.kiro/settings/mcp.json')),
      prompt: rules(at('.kiro/steering')),
      skill: skill(at('.kiro/skills')),
      subAgent: file(at('.kiro/agents')),
    };
  };
}
