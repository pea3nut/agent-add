import fs from 'fs';
import path from 'path';
import os from 'os';
import { readJSONOrNull, atomicWriteJSON, ensureDir } from '../utils/fs.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

function resolveConfigFilePath(
  configFile: string | Record<string, string>,
): string | null {
  if (typeof configFile === 'string') {
    return path.resolve(process.cwd(), configFile);
  }
  const platform = process.platform as string;
  const rawPath = (configFile as Record<string, string>)[platform] ?? (configFile as Record<string, string>)['linux'];
  if (!rawPath) return null;
  if (rawPath.startsWith('~/')) {
    return path.join(os.homedir(), rawPath.slice(2));
  }
  if (process.platform === 'win32' && rawPath.startsWith('%APPDATA%')) {
    const appData = process.env['APPDATA'] ?? path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, rawPath.slice('%APPDATA%'.length));
  }
  return rawPath;
}

export const mcpHandler: AssetHandler = {
  async handle(job: InstallJob): Promise<InstallResult> {
    const { host, assetName, resolvedSource } = job;
    const mcpCapability = host.assets['mcp'];

    const resolvedPath = resolveConfigFilePath(mcpCapability.configFile!);
    if (!resolvedPath) {
      return {
        job,
        status: 'error',
        reason: 'Host MCP configFile is not configured for this platform',
      };
    }
    const configFilePath = resolvedPath;

    const configKey = mcpCapability.configKey ?? 'mcpServers';

    let newServerConfig: Record<string, unknown>;
    try {
      const rawContent = await fs.promises.readFile(resolvedSource.localPath, 'utf-8');
      newServerConfig = JSON.parse(rawContent) as Record<string, unknown>;
    } catch (err) {
      return {
        job,
        status: 'error',
        reason: `Failed to read MCP source file: ${(err as Error).message}`,
      };
    }

    const existingConfig = (await readJSONOrNull<Record<string, unknown>>(configFilePath)) ?? {};
    const mcpServers = (existingConfig[configKey] as Record<string, unknown>) ?? {};

    if (assetName in mcpServers) {
      const existing = JSON.stringify(mcpServers[assetName]);
      const incoming = JSON.stringify(newServerConfig);
      if (existing === incoming) {
        return { job, status: 'exists', targetPath: configFilePath };
      }
      return {
        job,
        status: 'conflict',
        targetPath: configFilePath,
        reason: `${configFilePath} already has a '${assetName}' key with different content`,
      };
    }

    const updatedConfig = {
      ...existingConfig,
      [configKey]: {
        ...mcpServers,
        [assetName]: newServerConfig,
      },
    };

    await ensureDir(path.dirname(configFilePath));
    await atomicWriteJSON(configFilePath, updatedConfig);

    return { job, status: 'written', targetPath: configFilePath };
  },
};
