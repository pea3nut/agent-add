import {
  HostId,
  type HostAdapter,
  type AssetCapability,
  type AssetType,
  type UserEnvironment,
  type UserAssets,
} from './types.js';
import { unsupported, skill, prompt, userPaths } from './user-assets.js';

export class GooseAdapter implements HostAdapter {
  readonly id = HostId.Goose;
  readonly displayName = 'goose';
  readonly detection = {
    paths: ['.goosehints', '.goose/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: false,
      reason: 'No verified project-level MCP configuration target is supported.',
    },
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '.agents/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: false,
      reason:
        'Use goose skills; recipes and custom slash commands require a separate verified format.',
    },
    subAgent: {
      supported: false,
      reason:
        'goose custom-agent/recipe registration is not a verified drop-in sub-agent contract.',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { platform } = environment;
    const { at } = userPaths(environment);
    return {
      prompt: platform === 'win32' ? unsupported('No Windows user hints path is selected for goose.') : prompt(at('.config/goose/.goosehints')),
      skill: skill(at('.agents/skills')),
    };
  };
}
