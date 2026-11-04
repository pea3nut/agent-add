import {
  HostId,
  type HostAdapter,
  type AssetCapability,
  type AssetType,
  type UserEnvironment,
  type UserAssets,
} from './types.js';
import { skill, userPaths } from './user-assets.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class TraeAdapter implements HostAdapter {
  readonly id = HostId.Trae;
  readonly selectionPriority = 3;
  readonly displayName = 'Trae';
  readonly detection = {
    paths: ['.trae/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.trae/mcp.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.trae/rules',
      writeStrategy: 'create-file-in-dir',
    },
    skill: {
      supported: true,
      installDir: '.trae/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: NOT_SUPPORTED('Trae does not support custom slash commands via files.'),
    subAgent: NOT_SUPPORTED('Trae does not support sub-agent configuration files.'),
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at } = userPaths(environment);
    return { skill: skill(at('.trae/skills')) };
  };
}
