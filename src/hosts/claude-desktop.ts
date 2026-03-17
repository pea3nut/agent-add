import path from 'path';
import os from 'os';
import type { AssetCapability, HostConfig } from './types.js';

export function getClaudeDesktopConfigPath(host: HostConfig): string | null {
  const capability: AssetCapability = host.assets['mcp'];
  if (!capability.supported) return null;

  const configFile = capability.configFile as Record<string, string>;
  const platform = process.platform as string;
  const rawPath = configFile[platform] ?? configFile['linux'];

  if (!rawPath) return null;

  return expandPath(rawPath);
}

function expandPath(p: string): string {
  if (p.startsWith('~/')) {
    return path.join(os.homedir(), p.slice(2));
  }
  if (process.platform === 'win32' && p.startsWith('%APPDATA%')) {
    const appData = process.env['APPDATA'] ?? path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, p.slice('%APPDATA%'.length));
  }
  return p;
}
