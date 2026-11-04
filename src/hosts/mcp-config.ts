import { parse, stringify } from 'smol-toml';
import { isRecord, parseConfig, setConfigValue, type ConfigFormat } from '../utils/config.js';
import { deepEqualIgnoringKeyOrder } from '../utils/deep-equal.js';
import type { AssetCapability, HostAdapter, McpConfigEdit } from './types.js';

export function editTomlMcpConfig(
  tomlContent: string | null,
  configFilePath: string,
  assetName: string,
  newServerConfig: Record<string, unknown>,
  layout: 'table' | 'named-array',
  displayName: string,
): McpConfigEdit {
  let parsed: Record<string, unknown>;
  try {
    parsed = tomlContent ? (parse(tomlContent) as Record<string, unknown>) : {};
  } catch {
    throw new Error(`Failed to parse TOML config file: ${configFilePath}`);
  }

  if (layout === 'named-array') {
    // Named array entries use [[mcp_servers]].
    const mcpServers =
      (parsed['mcp_servers'] as Array<Record<string, unknown>>) ?? [];
    if (!Array.isArray(mcpServers) || mcpServers.some((s) => !isRecord(s)))
      throw new Error(displayName + ' mcp_servers must be an array of tables');
    const entry = newServerConfig;

    const existingIdx = mcpServers.findIndex((s) => s['name'] === assetName);
    if (existingIdx !== -1) {
      if (deepEqualIgnoringKeyOrder(mcpServers[existingIdx], entry)) {
        return { status: 'exists' };
      }
      return {
        status: 'conflict',
        reason: `${configFilePath} already has an mcp_servers entry named '${assetName}' with different content`,
      };
    }
    mcpServers.push(entry);
    parsed['mcp_servers'] = mcpServers;
  } else {
    if (parsed['mcp_servers'] === undefined) {
      parsed['mcp_servers'] = {};
    }
    const mcpServers = parsed['mcp_servers'] as Record<string, unknown>;
    if (!isRecord(mcpServers)) throw new Error('mcp_servers must be a table');
    const entry = newServerConfig;

    if (Object.hasOwn(mcpServers, assetName)) {
      if (deepEqualIgnoringKeyOrder(mcpServers[assetName], entry)) {
        return { status: 'exists' };
      }
      return {
        status: 'conflict',
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
      layout === 'named-array' ? [newServerConfig] : { [assetName]: newServerConfig },
  });
  let newToml = (tomlContent ?? '').trimEnd() + '\n\n' + addition;
  try {
    parse(newToml);
  } catch {
    newToml = stringify(parsed);
  }
  return { status: 'written', content: newToml };
}

function editJsonMcpConfig(
  current: string | null,
  configFilePath: string,
  assetName: string,
  newServerConfig: Record<string, unknown>,
  mcpCapability: AssetCapability,
): McpConfigEdit {
  const keyPath = [mcpCapability.configKey ?? 'mcpServers'];
  const format: ConfigFormat =
    mcpCapability.configFormat === 'jsonc' || configFilePath.endsWith('.jsonc')
      ? 'jsonc'
      : 'json';
  let existingContent = '{}\n';

  let existingConfig: Record<string, unknown>;
  try {
    existingContent = current ?? '{}\n';
    existingConfig = parseConfig(existingContent, format);
  } catch (err) {
    throw new Error(`Failed to parse existing config file as JSON: ${configFilePath}\n  Cause: ${(err as Error).message}`);
  }
  let mcpServers = existingConfig;
  for (const key of keyPath) {
    const next = Object.hasOwn(mcpServers, key) ? mcpServers[key] : {};
    if (!isRecord(next))
      throw new Error(`Configuration section '${key}' must be an object`);
    mcpServers = next;
  }

  if (Object.hasOwn(mcpServers, assetName)) {
    if (deepEqualIgnoringKeyOrder(mcpServers[assetName], newServerConfig)) {
      return { status: 'exists' };
    }
    return {
      status: 'conflict',
      reason: `${configFilePath} already has a '${assetName}' key with different content`,
    };
  }

  return {
    status: 'written',
    content: setConfigValue(existingContent, [...keyPath, assetName], newServerConfig, format),
  };
}

export function editMcpConfig(
  host: HostAdapter,
  current: string | null,
  file: string,
  name: string,
  server: Record<string, unknown>,
): McpConfigEdit {
  return host.mcp?.editConfig
    ? host.mcp.editConfig(current, file, name, server)
    : editJsonMcpConfig(current, file, name, server, host.assets.mcp);
}
