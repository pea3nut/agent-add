import fs from 'fs';
import path from 'path';
import os from 'os';
import { unwrapMcpServers } from '../utils/unwrap-mcp-servers.js';
import { createHandler } from './plan.js';

function resolveConfigFilePath(configFile: string | Record<string, string>, cwd: string): string {
  if (typeof configFile === 'string') return path.resolve(cwd, configFile);
  const rawPath = configFile[process.platform] ?? configFile['linux'];
  if (!rawPath) throw new Error('Host MCP configFile is not configured for this platform');
  const home = process.env['AGENT_ADD_HOME'] ?? os.homedir();
  if (rawPath.startsWith('~/')) return path.join(home, rawPath.slice(2));
  if (process.platform === 'win32' && rawPath.startsWith('%APPDATA%')) {
    const appData = process.env['AGENT_ADD_HOME']
      ? path.join(home, 'AppData', 'Roaming')
      : process.env['APPDATA'] ?? path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, rawPath.slice('%APPDATA%'.length));
  }
  if (process.platform === 'win32' && rawPath.startsWith('%USERPROFILE%')) return path.join(home, rawPath.slice('%USERPROFILE%'.length));
  return path.resolve(cwd, rawPath);
}

export const mcpHandler = createHandler(async (input) => {
  const { host, resolvedSource } = input;
  let config: Record<string, unknown>;
  try {
    config = JSON.parse(await fs.promises.readFile(resolvedSource.localPath, 'utf-8'));
  } catch {
    throw new Error('Failed to read MCP source file as JSON');
  }
  if (typeof config !== 'object' || config === null || Array.isArray(config)) throw new Error('MCP source must be a JSON object');
  const unwrapped = unwrapMcpServers(config);
  if (Object.hasOwn(config, 'mcpServers') && !unwrapped) throw new Error('Wrapped mcpServers format must contain exactly one server object');
  const job = unwrapped ? { ...input, assetName: unwrapped.name } : input;
  config = unwrapped?.config ?? config;
  const capability = host.assets.mcp;
  if (!capability.configFile) throw new Error('Host MCP configFile is not configured');
  const targetPath = resolveConfigFilePath(capability.configFile, job.cwd ?? process.cwd());
  if (!targetPath.endsWith('.toml')) {
    return { job, targetPath, kind: 'mcp-json', entry: config, configKey: capability.configKey ?? 'mcpServers' };
  }
  const entry: Record<string, unknown> = host.id === 'vibe'
    ? { name: job.assetName, transport: 'stdio', command: config['command'] ?? '' }
    : { command: config['command'] ?? '' };
  if (config['args']) entry['args'] = config['args'];
  if (host.id !== 'vibe' && config['env']) entry['env'] = config['env'];
  return { job, targetPath, kind: host.id === 'vibe' ? 'mcp-array' : 'mcp-table', entry, configKey: 'mcp_servers' };
});
