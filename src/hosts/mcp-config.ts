import { parse } from 'smol-toml';
import { TomlDocument, parse as parseDocumentValues } from '@decimalturn/toml-patch';
import { patch as patchTomlValues } from 'toml-patch-lite';
import { applyPatch, compare, getValueByPointer } from 'fast-json-patch';
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
  const source = tomlContent ?? '';
  let existingEntry: Record<string, unknown> = {};
  let update: (config: Record<string, unknown>, entry?: Record<string, unknown>) => void;
  if (layout === 'named-array') {
    // Named array entries use [[mcp_servers]].
    const mcpServers =
      (parsed['mcp_servers'] as Array<Record<string, unknown>>) ?? [];
    if (!Array.isArray(mcpServers) || mcpServers.some((s) => !isRecord(s)))
      throw new Error(displayName + ' mcp_servers must be an array of tables');
    const entry = newServerConfig;

    const existingIdx = mcpServers.findIndex((server) => server['name'] === assetName);
    overwritten = existingIdx !== -1;
    existingEntry = mcpServers[existingIdx] ?? {};
    if (overwritten && !overwrite) {
      const matches = mcpServers.filter((server) => server['name'] === assetName);
      if (matches.length === 1 && deepEqualIgnoringKeyOrder(matches[0], entry)) return { status: 'exists' };
      return { status: 'conflict', reason: `Different or duplicate MCP entries already use the name '${assetName}'; use --overwrite to replace them` };
    }
    update = (config, replacement = entry) => {
      const servers = (config['mcp_servers'] ?? []) as Record<string, unknown>[];
      const others = servers.filter((server) => server['name'] !== assetName);
      others.splice(overwritten ? existingIdx : others.length, 0, replacement);
      config['mcp_servers'] = others;
    };
  } else {
    if (parsed['mcp_servers'] === undefined) {
      parsed['mcp_servers'] = {};
    }
    const mcpServers = parsed['mcp_servers'] as Record<string, unknown>;
    if (!isRecord(mcpServers)) throw new Error('mcp_servers must be a table');
    const entry = newServerConfig;

    overwritten = Object.hasOwn(mcpServers, assetName);
    if (isRecord(mcpServers[assetName])) existingEntry = mcpServers[assetName];
    if (overwritten && !overwrite) {
      if (deepEqualIgnoringKeyOrder(mcpServers[assetName], entry)) return { status: 'exists' };
      return { status: 'conflict', reason: `MCP '${assetName}' already has different content; use --overwrite to replace it` };
    }
    update = (config, replacement = entry) => {
      const servers = (config['mcp_servers'] ?? {}) as Record<string, unknown>;
      Object.defineProperty(servers, assetName, { value: replacement, enumerable: true, writable: true, configurable: true });
      config['mcp_servers'] = servers;
    };
  }

  update(parsed);
  // Preserve mixed line endings inside unchanged string values. This only
  // chooses the bytes to write; forced installs still write and report overwritten.
  if (overwritten && deepEqualIgnoringKeyOrder(parse(source), parsed))
    return { status: 'overwritten', content: source };

  // Keep existing strings during structural edits. The full writer normalizes
  // literal-string newlines and may misplace adjacent array comments when a
  // string changes width. The official lite editor replaces scalar values only,
  // preserving their surrounding source and the requested data line endings.
  const changes = compare(existingEntry, newServerConfig);
  const retainedStrings = changes
    .filter((op) => op.op === 'replace' && typeof op.value === 'string' && typeof getValueByPointer(existingEntry, op.path) === 'string')
    .map((op) => ({ op: 'replace' as const, path: op.path, value: getValueByPointer(existingEntry, op.path) }));
  const structuralEntry = retainedStrings.length
    ? applyPatch(newServerConfig, retainedStrings, false, false).newDocument
    : newServerConfig;
  const finalValues = parseDocumentValues(source) as Record<string, unknown>;
  update(finalValues);
  const changedArrays = [...new Set(changes
    .filter((op) => op.op === 'add' || op.op === 'remove')
    .map((op) => op.path.slice(0, op.path.lastIndexOf('/')))
    .filter((pointer) => Array.isArray(getValueByPointer(existingEntry, pointer))))];

  const edit = (rebuildArrays = false): string => {
    const document = new TomlDocument(source);
    let values = document.toJsObject as Record<string, unknown>;
    if (layout === 'named-array' && !Object.hasOwn(values, 'mcp_servers')) {
      // Materialize the collection before adding its first table through the editor.
      document.patch({ ...values, mcp_servers: [] });
      values = document.toJsObject as Record<string, unknown>;
    }
    if (rebuildArrays) {
      const emptied = changedArrays.map((pointer) => ({ op: 'replace' as const, path: pointer, value: [] }));
      update(values, applyPatch(existingEntry, emptied, false, false).newDocument);
      document.patch(values);
      values = document.toJsObject as Record<string, unknown>;
    }
    update(values, structuralEntry);
    document.patch(values);
    let scalarSource = document.toTomlString;
    if (retainedStrings.length) {
      // Lite rejects array permutations. A scalar-only intermediate removes the
      // old string identities; both passes edit values through the library and
      // no intermediate content reaches the filesystem.
      const stagedValues = parseDocumentValues(scalarSource) as Record<string, unknown>;
      const resets = retainedStrings.map((op) => ({ ...op, value: 0 }));
      update(stagedValues, applyPatch(structuralEntry, resets, false, false).newDocument);
      scalarSource = patchTomlValues(scalarSource, stagedValues);
    }
    const content = patchTomlValues(scalarSource, finalValues);
    // Validate the UTF-8 bytes writeFile emits; lite does not reject unpaired surrogates.
    if (!deepEqualIgnoringKeyOrder(parse(Buffer.from(content, 'utf8').toString('utf8')), parsed))
      throw new Error('TOML edit did not preserve the planned configuration: ' + configFilePath);
    return content;
  };
  let content: string;
  try {
    content = edit();
  } catch (error) {
    if (!changedArrays.length) throw error;
    // Some annotated array insertions/removals confuse the full writer. Rebuild
    // only those arrays through the document API; removed member comments follow
    // the library's deletion rules. Neither attempt writes before validation.
    content = edit(true);
  }
  return { status: overwritten ? 'overwritten' : 'written', content };
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
  if (overwritten && !overwrite) {
    if (deepEqualIgnoringKeyOrder(mcpServers[assetName], newServerConfig)) return { status: 'exists' };
    return { status: 'conflict', reason: `MCP '${assetName}' already has different content; use --overwrite to replace it` };
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
