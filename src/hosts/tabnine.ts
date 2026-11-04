import {
  HostId,
  type HostAdapter,
  type AssetCapability,
  type AssetType,
  type UserEnvironment,
  type UserAssets,
} from './types.js';
import { file, mcp, userPaths } from './user-assets.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class TabnineAdapter implements HostAdapter {
  readonly id = HostId.Tabnine;
  readonly displayName = 'Tabnine CLI';
  readonly detection = {
    paths: ['.tabnine/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: true,
      configFile: '.tabnine/mcp_servers.json',
      configKey: 'mcpServers',
      writeStrategy: 'inject-json-key',
    },
    prompt: {
      supported: true,
      installDir: '.tabnine/guidelines',
      writeStrategy: 'create-file-in-dir',
    },
    skill: NOT_SUPPORTED(
      'Tabnine CLI does not support project-level skill directories.',
    ),
    command: {
      supported: true,
      installDir: '.tabnine/agent/commands/',
      fileExtension: '.toml',
      writeStrategy: 'copy-file',
    },
    subAgent: NOT_SUPPORTED(
      'Tabnine CLI does not support sub-agent configuration files.',
    ),
  };

  readonly userAssets = (environment: UserEnvironment): UserAssets => {
    const { at } = userPaths(environment);
    return {
      mcp: mcp(at('.tabnine/mcp_servers.json')),
      command: file(at('.tabnine/agent/commands'), '.toml'),
    };
  };
}
