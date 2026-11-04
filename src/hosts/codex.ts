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

export class CodexAdapter implements HostAdapter {
  readonly id = HostId.Codex;
  readonly displayName = 'Codex CLI';
  readonly detection = {
    paths: ['.codex/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.codex/config.toml',
      configKey: 'mcp_servers',
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
    command: NOT_SUPPORTED(
      'Codex CLI does not support custom slash commands via files.',
    ),
    subAgent: {
      supported: true,
      installDir: '.codex/agents/',
      fileExtension: '.toml',
      writeStrategy: 'copy-file',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at, override } = userPaths(environment);
    const root = override('CODEX_HOME', at('.codex'));
    return {
      mcp: mcp(path.join(root, 'config.toml'), 'mcp_servers'),
      prompt: prompt(path.join(root, 'AGENTS.md')),
      skill: skill(at('.agents/skills')),
      subAgent: file(path.join(root, 'agents'), '.toml'),
    };
  };
}
