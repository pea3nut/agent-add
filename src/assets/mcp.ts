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
  if (process.platform === 'win32' && rawPath.startsWith('%USERPROFILE%')) {
    return path.join(os.homedir(), rawPath.slice('%USERPROFILE%'.length));
  }
  return rawPath;
}

async function handleTomlMcp(
  job: InstallJob,
  configFilePath: string,
  newServerConfig: Record<string, unknown>,
): Promise<InstallResult> {
  const { parse, stringify } = await import('smol-toml');
  const { host, assetName } = job;

  await ensureDir(path.dirname(configFilePath));

  let tomlContent = '';
  try {
    tomlContent = await fs.promises.readFile(configFilePath, 'utf-8');
  } catch {
    // file doesn't exist yet
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = tomlContent ? (parse(tomlContent) as Record<string, unknown>) : {};
  } catch {
    return {
      job,
      status: 'error',
      reason: `Failed to parse TOML config file: ${configFilePath}`,
    };
  }

  if (host.id === 'vibe') {
    // Vibe uses [[mcp_servers]] array format
    const mcpServers = (parsed['mcp_servers'] as Array<Record<string, unknown>>) ?? [];
    const existing = mcpServers.find((s) => s['name'] === assetName);
    if (existing) {
      return { job, status: 'exists', targetPath: configFilePath };
    }
    const entry: Record<string, unknown> = {
      name: assetName,
      transport: 'stdio',
      command: (newServerConfig['command'] as string) ?? '',
    };
    if (newServerConfig['args']) entry['args'] = newServerConfig['args'];
    mcpServers.push(entry);
    parsed['mcp_servers'] = mcpServers;
  } else {
    // Default TOML format: [mcp_servers.<name>] table (e.g. Codex)
    if (!parsed['mcp_servers']) {
      parsed['mcp_servers'] = {};
    }
    const mcpServers = parsed['mcp_servers'] as Record<string, unknown>;
    if (assetName in mcpServers) {
      return { job, status: 'exists', targetPath: configFilePath };
    }
    const entry: Record<string, unknown> = {
      command: (newServerConfig['command'] as string) ?? '',
    };
    if (newServerConfig['args']) entry['args'] = newServerConfig['args'];
    if (newServerConfig['env']) entry['env'] = newServerConfig['env'];
    mcpServers[assetName] = entry;
  }

  const newToml = stringify(parsed);
  const tmpFile = configFilePath + '.tmp';
  await fs.promises.writeFile(tmpFile, newToml, 'utf-8');
  await fs.promises.rename(tmpFile, configFilePath);

  return { job, status: 'written', targetPath: configFilePath };
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

    // Dispatch to TOML handler when config file has .toml extension
    if (configFilePath.endsWith('.toml')) {
      return handleTomlMcp(job, configFilePath, newServerConfig);
    }

    const configKey = mcpCapability.configKey ?? 'mcpServers';

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
