import path from 'path';
import {
  HostId,
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

export class GeminiAdapter implements HostAdapter {
  readonly id = HostId.Gemini;
  readonly displayName = 'Gemini CLI';
  readonly detection = {
    paths: ['.gemini/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.gemini/settings.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      targetFile: 'GEMINI.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '.gemini/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.gemini/commands/',
      fileExtension: '.toml',
      writeStrategy: 'copy-file',
    },
    subAgent: {
      supported: true,
      installDir: '.gemini/agents/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { home } = environment;
    const { override } = userPaths(environment);
    const root = path.join(override('GEMINI_CLI_HOME', home), '.gemini');
    return {
      mcp: mcp(path.join(root, 'settings.json'), 'mcpServers', true),
      prompt: prompt(path.join(root, 'GEMINI.md')),
      skill: skill(path.join(root, 'skills')),
      command: file(path.join(root, 'commands'), '.toml'),
      subAgent: file(path.join(root, 'agents')),
    };
  };
}
