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

export class AugmentAdapter implements HostAdapter {
  readonly id = HostId.Augment;
  readonly displayName = 'Augment';
  readonly detection = {
    paths: ['.augment/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.augment/settings.json',
      configKey: 'mcpServers',
      configFormat: 'jsonc',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.augment/rules',
      writeStrategy: 'create-file-in-dir',
    },
    skill: {
      supported: true,
      installDir: '.augment/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.augment/commands/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
    subAgent: {
      supported: true,
      installDir: '.augment/agents/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at } = userPaths(environment);
    return {
      mcp: mcp(at('.augment/settings.json'), 'mcpServers', true),
      prompt: rules(at('.augment/rules')),
      skill: skill(at('.augment/skills')),
      command: file(at('.augment/commands')),
      subAgent: file(at('.augment/agents')),
    };
  };
}
