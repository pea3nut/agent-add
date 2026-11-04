import {
  HostId,
  type HostAdapter,
  type AssetCapability,
  type AssetType,
  type UserEnvironment,
  type UserAssets,
} from './types.js';
import { skill, prompt, mcp, userPaths } from './user-assets.js';

export class AmpAdapter implements HostAdapter {
  readonly id = HostId.Amp;
  readonly displayName = 'Amp CLI';
  readonly detection = { paths: ['.amp/'] };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.amp/settings.json',
      configFileAlternatives: ['.amp/settings.jsonc'],
      configFormat: 'jsonc',
      configKey: 'amp.mcpServers',
      writeStrategy: 'inject-json-key',
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
      reason: 'Amp has no verified standalone command-file discovery contract.',
    },
    subAgent: {
      supported: false,
      reason:
        'Amp built-in delegation is not a standalone sub-agent file contract.',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at } = userPaths(environment);
    return {
      mcp: {
        ...mcp(at('.config/amp/settings.json'), 'amp.mcpServers', true),
        configFileAlternatives: [at('.config/amp/settings.jsonc')],
      },
      prompt: prompt(at('.config/amp/AGENTS.md')),
      skill: skill(at('.config/amp/skills')),
    };
  };
}
