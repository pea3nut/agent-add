import { parse, stringify } from 'smol-toml';
import { deepEqualIgnoringKeyOrder } from '../utils/deep-equal.js';
import { isRecord, parseConfig, setConfigValue, type ConfigFormat } from '../utils/config.js';
import type { AssetCapability, HostAdapter, McpConfigEdit } from './types.js';

export function editTomlMcpConfig(
  tomlContent: string | null,
  configFilePath: string,
  assetName: string,
  newServerConfig: Record<string, unknown>,
  layout: 'table' | 'named-array',
  displayName: string,
  overwrite = false,
): McpConfigEdit {
  let parsed: Record<string, unknown>;
  try {
    parsed = tomlContent ? (parse(tomlContent) as Record<string, unknown>) : {};
  } catch {
    throw new Error(`Failed to parse TOML config file: ${configFilePath}`);
  }

  let overwritten = false;
  if (layout === 'named-array') {
    // Named array entries use [[mcp_servers]].
    const mcpServers =
      (parsed['mcp_servers'] as Array<Record<string, unknown>>) ?? [];
    if (!Array.isArray(mcpServers) || mcpServers.some((s) => !isRecord(s)))
      throw new Error(displayName + ' mcp_servers must be an array of tables');
    const entry = newServerConfig;

    const existingIdx = mcpServers.findIndex((server) => server['name'] === assetName);
    overwritten = existingIdx !== -1;
    if (overwritten) {
      const matches = mcpServers.filter((server) => server['name'] === assetName);
      if (matches.length === 1 && deepEqualIgnoringKeyOrder(matches[0], entry)) return { status: 'exists' };
      if (!overwrite) return { status: 'conflict', reason: `Different or duplicate MCP entries already use the name '${assetName}'; use --overwrite to replace them` };
    }
    const others = mcpServers.filter((server) => server['name'] !== assetName);
    others.splice(overwritten ? existingIdx : others.length, 0, entry);
    mcpServers.splice(0, mcpServers.length, ...others);
    parsed['mcp_servers'] = mcpServers;
  } else {
    if (parsed['mcp_servers'] === undefined) {
      parsed['mcp_servers'] = {};
    }
    const mcpServers = parsed['mcp_servers'] as Record<string, unknown>;
    if (!isRecord(mcpServers)) throw new Error('mcp_servers must be a table');
    const entry = newServerConfig;

    overwritten = Object.hasOwn(mcpServers, assetName);
    if (overwritten) {
      if (deepEqualIgnoringKeyOrder(mcpServers[assetName], entry)) return { status: 'exists' };
      if (!overwrite) return { status: 'conflict', reason: `MCP '${assetName}' already has different content; use --overwrite to replace it` };
    }
    Object.defineProperty(mcpServers, assetName, {
      value: entry,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }

  if (overwritten) return { status: 'overwritten', content: stringify(parsed) };
  const addition = stringify({ mcp_servers: layout === 'named-array' ? [newServerConfig] : { [assetName]: newServerConfig } });
  const appended = (tomlContent ?? '').trimEnd() + '\n\n' + addition;
  try { parse(appended); return { status: 'written', content: appended }; }
  catch { return { status: 'written', content: stringify(parsed) }; }

}

function editJsonMcpConfig(
  current: string | null,
  configFilePath: string,
  assetName: string,
  newServerConfig: Record<string, unknown>,
  mcpCapability: AssetCapability,
  overwrite = false,
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

  const overwritten = Object.hasOwn(mcpServers, assetName);
  if (overwritten) {
    if (deepEqualIgnoringKeyOrder(mcpServers[assetName], newServerConfig)) return { status: 'exists' };
    if (!overwrite) return { status: 'conflict', reason: `MCP '${assetName}' already has different content; use --overwrite to replace it` };
  }

  return {
    status: overwritten ? 'overwritten' : 'written',
    content: setConfigValue(existingContent, [...keyPath, assetName], newServerConfig, format),
  };
}

export function editMcpConfig(
  host: HostAdapter,
  current: string | null,
  file: string,
  name: string,
  server: Record<string, unknown>,
  overwrite = false,
): McpConfigEdit {
  return host.mcp?.editConfig
    ? host.mcp.editConfig(current, file, name, server, overwrite)
    : editJsonMcpConfig(current, file, name, server, host.assets.mcp, overwrite);
}
