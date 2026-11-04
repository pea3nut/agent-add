import {
  HostId,
  type HostAdapter,
  type AssetCapability,
  type AssetType,
  type UserEnvironment,
  type UserAssets,
} from './types.js';
import { skill, file, rules, userPaths } from './user-assets.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class RooCodeAdapter implements HostAdapter {
  readonly id = HostId.RooCode;
  readonly displayName = 'Roo Code';
  readonly detection = {
    paths: ['.roo/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.roo/mcp.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.roo/rules',
      writeStrategy: 'create-file-in-dir',
    },
    skill: {
      supported: true,
      installDir: '.roo/skills',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.roo/commands/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
    subAgent: NOT_SUPPORTED('Roo Code does not support sub-agent configuration files.'),
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at } = userPaths(environment);
    return {
      prompt: rules(at('.roo/rules')),
      skill: skill(at('.roo/skills')),
      command: file(at('.roo/commands')),
    };
  };
}
