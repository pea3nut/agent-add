import path from 'path';
import { readTextOrNull } from '../utils/config.js';
import {
  HostId,
  type HostAdapter,
  type AssetCapability,
  type AssetType,
  type UserEnvironment,
  type UserAssets,
} from './types.js';
import { unsupported, skill, prompt, userPaths } from './user-assets.js';

export class ZedAdapter implements HostAdapter {
  readonly id = HostId.Zed;
  readonly displayName = 'Zed Agent';
  readonly detection = { paths: ['.zed/'] };
  readonly resolvePromptTarget = async (host: HostAdapter): Promise<string> => {
    const cwd = host.rootDir ?? process.cwd();
    if (host.scope !== 'user') {
      const candidates = [
        '.rules',
        '.cursorrules',
        '.windsurfrules',
        '.clinerules',
        '.github/copilot-instructions.md',
        'AGENT.md',
        'AGENTS.md',
        'CLAUDE.md',
        'GEMINI.md',
      ];
      for (const candidate of candidates)
        if ((await readTextOrNull(path.resolve(cwd, candidate))) !== null)
          return path.resolve(cwd, candidate);
    }
    return path.resolve(host.assets.prompt.targetFile!);
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
        'Use Zed skills for slash commands; no independent command-file target is verified.',
    },
    subAgent: {
      supported: false,
      reason:
        'External agents and profiles do not define a Zed sub-agent asset-file format.',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { platform } = environment;
    const { at } = userPaths(environment);
    return {
      prompt: platform === 'win32' ? unsupported('No Windows user instruction path is selected for Zed.') : prompt(at('.config/zed/AGENTS.md')),
      skill: skill(at('.agents/skills')),
    };
  };
}
