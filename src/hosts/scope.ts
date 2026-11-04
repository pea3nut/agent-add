import os from 'os';
import path from 'path';
import type {
  AssetCapability,
  AssetType,
  HostAdapter,
  InstallScope,
  UserEnvironment,
} from './types.js';
import { unsupported, userPaths } from './user-assets.js';

export function selectHostScope(
  host: HostAdapter,
  scope: InstallScope,
  cwd: string,
  environment: UserEnvironment = {
    home: os.homedir(),
    env: process.env,
    platform: process.platform,
  },
): HostAdapter {
  const selected =
    scope === 'user' ? (host.userAssets?.(environment) ?? {}) : host.assets;
  const assets = {} as Record<AssetType, AssetCapability>;
  for (const type of ['mcp', 'skill', 'prompt', 'command', 'subAgent'] as const) {
    let capability: AssetCapability = {
      ...(selected[type] ??
        unsupported(
          'No verified user-level ' + type +
          ' installation target is selected for ' + host.displayName + '.',
        )),
    };
    if (scope === 'user' && environment.env.XDG_CONFIG_HOME) {
      const root = path.join(environment.home, '.config') + path.sep;
      if (
        [capability.configFile, capability.targetFile, capability.installDir]
          .some((target) => target?.startsWith(root))
      )
        capability = userPaths(environment).reject('XDG_CONFIG_HOME');
    }
    for (const key of ['configFile', 'installDir', 'targetFile'] as const)
      if (capability[key]) capability[key] = path.resolve(cwd, capability[key]);
    if (capability.configFileAlternatives)
      capability.configFileAlternatives = capability.configFileAlternatives.map(
        (file) => path.resolve(cwd, file),
      );
    assets[type] = capability;
  }
  return {
    ...host,
    assets,
    scope,
    rootDir: path.resolve(cwd),
  };
}
