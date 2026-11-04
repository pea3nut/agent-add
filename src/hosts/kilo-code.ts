import { openCodeMcp } from './mcp.js';
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

export class KiloCodeAdapter implements HostAdapter {
  readonly id = HostId.KiloCode;
  readonly displayName = 'Kilo Code';
  readonly detection = {
    paths: ['.kilo/', 'kilo.jsonc', 'kilo.json', '.kilocode/'],
  };
  readonly mcp: McpAdapter = {
    convert: (input) => openCodeMcp(input, this.id),
  };

  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: 'kilo.jsonc',
      configFileAlternatives: [
        'kilo.json',
        '.kilo/kilo.jsonc',
        '.kilo/kilo.json',
      ],
      configKey: 'mcp',
      configFormat: 'jsonc',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.kilo/rules',
      registration: 'instructions',
      writeStrategy: 'create-file-in-dir',
    },
    skill: {
      supported: true,
      installDir: '.kilo/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.kilo/commands/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
    subAgent: {
      supported: true,
      installDir: '.kilo/agents/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at } = userPaths(environment);
    return {
      mcp: {
        ...mcp(at('.config/kilo/kilo.jsonc'), 'mcp', true),
        configFileAlternatives: [at('.config/kilo/kilo.json')],
      },
      skill: skill(at('.kilo/skills')),
      command: file(at('.config/kilo/commands')),
      subAgent: file(at('.config/kilo/agents')),
    };
  };
}
