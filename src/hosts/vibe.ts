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

export class VibeAdapter implements HostAdapter {
  readonly id = HostId.Vibe;
  readonly displayName = 'Mistral Vibe';
  readonly detection = {
    paths: ['.vibe/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.vibe/config.toml',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '.vibe/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: NOT_SUPPORTED(
      'Mistral Vibe does not support custom slash commands via files.',
    ),
    subAgent: {
      supported: true,
      installDir: '.vibe/agents/',
      fileExtension: '.toml',
      writeStrategy: 'copy-file',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at, override } = userPaths(environment);
    const root = override('VIBE_HOME', at('.vibe'));
    return {
      mcp: mcp(path.join(root, 'config.toml'), 'mcp_servers'),
      prompt: prompt(path.join(root, 'AGENTS.md')),
      skill: skill(path.join(root, 'skills')),
      subAgent: file(path.join(root, 'agents'), '.toml'),
    };
  };
}
