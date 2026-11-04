import path from 'path';
import {
  HostId,
  type HostAdapter,
  type AssetCapability,
  type AssetType,
  type UserEnvironment,
  type UserAssets,
} from './types.js';
import { skill, rules, mcp, userPaths } from './user-assets.js';

export class ClineAdapter implements HostAdapter {
  readonly id = HostId.Cline;
  readonly displayName = 'Cline CLI';
  readonly detection = { paths: ['.cline/'] };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: false,
      reason: 'No verified project-level MCP configuration target is supported.',
    },
    prompt: {
      supported: true,
      installDir: '.cline/rules/',
      writeStrategy: 'create-file-in-dir',
    },
    skill: {
      supported: true,
      installDir: '.cline/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: false,
      reason:
        'Use Cline skills for slash invocation; no independent command-file schema is verified.',
    },
    subAgent: {
      supported: false,
      reason:
        'Cline subagent discovery and required file schema are not verified; IDE and CLI capabilities differ.',
    },
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at, override } = userPaths(environment);
    const root = override('CLINE_DIR', at('.cline'));
    const data = override('CLINE_DATA_DIR', path.join(root, 'data'));
    return {
      mcp: mcp(override('CLINE_MCP_SETTINGS_PATH', path.join(data, 'settings/cline_mcp_settings.json'))),
      prompt: rules(path.join(root, 'rules')),
      skill: skill(path.join(root, 'skills')),
    };
  };
}
