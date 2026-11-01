import fs from 'fs';
import {
  atomicWriteText,
  isRecord,
  parseConfig,
  readTextOrNull,
  resolveConfigPath,
  setConfigValue,
  type ConfigFormat,
} from '../utils/config.js';
import { convertMcpServer } from './mcp-format.js';
import { unwrapMcpServers } from '../utils/unwrap-mcp-servers.js';
import { deepEqualIgnoringKeyOrder } from '../utils/deep-equal.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

async function handleTomlMcp(
  job: InstallJob,
  configFilePath: string,
  assetName: string,
  newServerConfig: Record<string, unknown>,
): Promise<InstallResult> {
  const { parse, stringify } = await import('smol-toml');
  const { host } = job;

  const tomlContent = await readTextOrNull(configFilePath);

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
    const mcpServers =
      (parsed['mcp_servers'] as Array<Record<string, unknown>>) ?? [];
    if (!Array.isArray(mcpServers) || mcpServers.some((s) => !isRecord(s)))
      throw new Error('Vibe mcp_servers must be an array of tables');
    const entry = newServerConfig;

    const existingIdx = mcpServers.findIndex((s) => s['name'] === assetName);
    if (existingIdx !== -1) {
      if (deepEqualIgnoringKeyOrder(mcpServers[existingIdx], entry)) {
        return { job, status: 'exists', targetPath: configFilePath };
      }
      return {
        job,
        status: 'conflict',
        targetPath: configFilePath,
        reason: `${configFilePath} already has an mcp_servers entry named '${assetName}' with different content`,
      };
    }
    mcpServers.push(entry);
    parsed['mcp_servers'] = mcpServers;
  } else {
    // Default TOML format: [mcp_servers.<name>] table (e.g. Codex)
    if (parsed['mcp_servers'] === undefined) {
      parsed['mcp_servers'] = {};
    }
    const mcpServers = parsed['mcp_servers'] as Record<string, unknown>;
    if (!isRecord(mcpServers)) throw new Error('mcp_servers must be a table');
    const entry = newServerConfig;

    if (Object.hasOwn(mcpServers, assetName)) {
      if (deepEqualIgnoringKeyOrder(mcpServers[assetName], entry)) {
        return { job, status: 'exists', targetPath: configFilePath };
      }
      return {
        job,
        status: 'conflict',
        targetPath: configFilePath,
        reason: `${configFilePath} already has a '${assetName}' key with different content`,
      };
    }
    Object.defineProperty(mcpServers, assetName, {
      value: entry,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }

  const addition = stringify({
    mcp_servers:
      host.id === 'vibe' ? [newServerConfig] : { [assetName]: newServerConfig },
  });
  let newToml = (tomlContent ?? '').trimEnd() + '\n\n' + addition;
  try {
    parse(newToml);
  } catch {
    newToml = stringify(parsed);
  }
  await atomicWriteText(configFilePath, newToml);

  return { job, status: 'written', targetPath: configFilePath };
}

export const mcpHandler: AssetHandler = {
  async handle(job: InstallJob): Promise<InstallResult> {
    const { host, resolvedSource } = job;
    let assetName = job.assetName;
    const mcpCapability = host.assets['mcp'];

    let configFilePath: string;
    try {
      configFilePath = await resolveConfigPath(mcpCapability);
    } catch (err) {
      return {
        job,
        status: 'error',
        reason: (err as Error).message,
      };
    }

    let newServerConfig: Record<string, unknown>;
    try {
      const rawContent = await fs.promises.readFile(
        resolvedSource.localPath,
        'utf-8',
      );
      newServerConfig = JSON.parse(rawContent) as Record<string, unknown>;
      if (!isRecord(newServerConfig))
        throw new Error('MCP source must be a JSON object');

      // Unwrap nested mcpServers format if present
      const unwrapped = unwrapMcpServers(newServerConfig);
      if (unwrapped) {
        newServerConfig = unwrapped.config;
        assetName = unwrapped.name;
      }
      newServerConfig = convertMcpServer(job, newServerConfig, assetName);
    } catch (err) {
      return {
        job,
        status: 'error',
        reason: `Failed to read MCP source file: ${(err as Error).message}`,
      };
    }

    // Dispatch to TOML handler when config file has .toml extension
    if (configFilePath.endsWith('.toml')) {
      try {
        return await handleTomlMcp(
          job,
          configFilePath,
          assetName,
          newServerConfig,
        );
      } catch (err) {
        return {
          job,
          status: 'error',
          targetPath: configFilePath,
          reason: (err as Error).message,
        };
      }
    }

    const keyPath = mcpCapability.configKeyPath ?? [
      mcpCapability.configKey ?? 'mcpServers',
    ];
    const format: ConfigFormat =
      mcpCapability.configFormat === 'yaml'
        ? 'yaml'
        : mcpCapability.configFormat === 'json5'
          ? 'json5'
          : mcpCapability.configFormat === 'jsonc' ||
              configFilePath.endsWith('.jsonc')
            ? 'jsonc'
            : 'json';
    let existingContent = '{}\n';

    let existingConfig: Record<string, unknown>;
    try {
      existingContent = (await readTextOrNull(configFilePath)) ?? '{}\n';
      existingConfig = parseConfig(existingContent, format);
    } catch (err) {
      return {
        job,
        status: 'error',
        reason: `Failed to parse existing config file as JSON: ${configFilePath}\n  Cause: ${(err as Error).message}`,
      };
    }
    let mcpServers = existingConfig;
    for (const key of keyPath) {
      const next = Object.hasOwn(mcpServers, key) ? mcpServers[key] : {};
      if (!isRecord(next))
        return {
          job,
          status: 'error',
          targetPath: configFilePath,
          reason: `Configuration section '${key}' must be an object`,
        };
      mcpServers = next;
    }

    if (Object.hasOwn(mcpServers, assetName)) {
      if (deepEqualIgnoringKeyOrder(mcpServers[assetName], newServerConfig)) {
        return { job, status: 'exists', targetPath: configFilePath };
      }
      return {
        job,
        status: 'conflict',
        targetPath: configFilePath,
        reason: `${configFilePath} already has a '${assetName}' key with different content`,
      };
    }

    try {
      await atomicWriteText(
        configFilePath,
        setConfigValue(
          existingContent,
          [...keyPath, assetName],
          newServerConfig,
          format,
        ),
      );
    } catch (err) {
      return {
        job,
        status: 'error',
        targetPath: configFilePath,
        reason: (err as Error).message,
      };
    }

    return { job, status: 'written', targetPath: configFilePath };
  },
};
