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
import { skill, file, prompt, mcp, userPaths } from './user-assets.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class OpencodeAdapter implements HostAdapter {
  readonly id = HostId.OpenCode;
  readonly selectionPriority = 15;
  readonly displayName = 'opencode';
  readonly detection = {
    paths: ['opencode.json', 'opencode.jsonc', '.opencode/'],
  };
  readonly mcp: McpAdapter = {
    convert: (input) => openCodeMcp(input, this.id, true),
  };

  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: 'opencode.json',
      configFileAlternatives: ['opencode.jsonc'],
      configFormat: 'jsonc',
      configKey: 'mcp',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '.opencode/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.opencode/commands/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
    subAgent: {
      supported: true,
      installDir: '.opencode/agents/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at, custom, reject } = userPaths(environment);
    const name = custom(['OPENCODE_CONFIG', 'OPENCODE_CONFIG_DIR', 'OPENCODE_CONFIG_CONTENT']);
    if (name) return Object.fromEntries(['mcp', 'prompt', 'skill', 'command', 'subAgent'].map((type) => [type, reject(name)]));
    return {
      mcp: {
        ...mcp(at('.config/opencode/opencode.json'), 'mcp', true),
        configFileAlternatives: [at('.config/opencode/opencode.jsonc')],
      },
      prompt: prompt(at('.config/opencode/AGENTS.md')),
      skill: skill(at('.config/opencode/skills')),
      command: file(at('.config/opencode/commands')),
      subAgent: file(at('.config/opencode/agents')),
    };
  };
}
