import path from 'path';
import type { AssetType, AssetCapability, HostConfig } from './types.js';

export function getClaudeCodeAssetPath(
  host: HostConfig,
  assetType: AssetType,
  assetName: string,
  cwd: string,
): string | null {
  const capability: AssetCapability = host.assets[assetType];
  if (!capability.supported) return null;

  switch (assetType) {
    case 'mcp': {
      const configFile = capability.configFile as string;
      return path.resolve(cwd, configFile);
    }
    case 'skill': {
      const installDir = capability.installDir as string;
      return path.resolve(cwd, installDir, assetName);
    }
    case 'prompt': {
      const targetFile = capability.targetFile as string;
      return path.resolve(cwd, targetFile);
    }
    case 'command': {
      const installDir = capability.installDir as string;
      const ext = capability.fileExtension ?? '.md';
      return path.resolve(cwd, installDir, `${assetName}${ext}`);
    }
    case 'subAgent': {
      const installDir = capability.installDir as string;
      const ext = capability.fileExtension ?? '.md';
      return path.resolve(cwd, installDir, `${assetName}${ext}`);
    }
  }
}
