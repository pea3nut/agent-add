import path from 'path';
import { describe, expect, it } from 'vitest';
import { getHost } from '../../src/hosts/index.js';
import { selectHostScope } from '../../src/hosts/scope.js';
import { convertMcpServer } from '../../src/assets/mcp-format.js';
import type { InstallJob } from '../../src/assets/types.js';

describe('scope path selection', () => {
  const home = path.resolve('test-home');
  const cwd = path.resolve('test-project');
  const environment = { home, env: {}, platform: 'linux' as const };

  it('resolves project paths without mutating the registered adapter', () => {
    const host = getHost('claude-code')!;
    const selected = selectHostScope(host, 'project', cwd, environment);
    expect(selected.assets.mcp.configFile).toBe(path.join(cwd, '.mcp.json'));
    expect(host.assets.mcp.configFile).toBe('.mcp.json');
    expect(host.scope).toBeUndefined();
  });

  it('selects the macOS Claude Desktop path without enabling project support', () => {
    const host = getHost('claude-desktop')!;
    const selected = selectHostScope(host, 'user', cwd, { ...environment, platform: 'darwin' });
    expect(selected.assets.mcp.configFile).toBe(path.join(home, 'Library/Application Support/Claude/claude_desktop_config.json'));
    expect(host.assets.mcp.supported).toBe(false);
  });

  it('selects the Windows Claude Desktop path from APPDATA', () => {
    const appData = path.resolve('app-data');
    const selected = selectHostScope(getHost('claude-desktop')!, 'user', cwd, { ...environment, platform: 'win32', env: { APPDATA: appData } });
    expect(selected.assets.mcp.configFile).toBe(path.join(appData, 'Claude/claude_desktop_config.json'));
  });

  it('does not invent a Linux or missing-APPDATA Desktop target', () => {
    for (const platform of ['linux', 'win32'] as const) {
      const selected = selectHostScope(getHost('claude-desktop')!, 'user', cwd, { ...environment, platform });
      expect(selected.assets.mcp.supported).toBe(false);
      expect(selected.assets.mcp.configFile).toBeUndefined();
    }
  });

  it('rejects relative root overrides before resolving destinations', () => {
    expect(() => selectHostScope(getHost('codex')!, 'user', cwd, { ...environment, env: { CODEX_HOME: './relative' } })).toThrow('CODEX_HOME must be an absolute path');
  });

  it('normalizes Claude Desktop stdio without leaking portable selectors', () => {
    const job: InstallJob = {
      assetType: 'mcp', assetName: 'demo', host: getHost('claude-desktop')!,
      resolvedSource: { type: 'inline-json', localPath: '', originalSource: '{}' },
    };
    expect(convertMcpServer(job, { command: 'node', args: ['server.js'], environment: { MODE: 'test' }, type: 'stdio' }, 'demo'))
      .toEqual({ command: 'node', args: ['server.js'], env: { MODE: 'test' } });
  });

  it('rejects remote and unrepresentable Claude Desktop MCP entries', () => {
    const job: InstallJob = {
      assetType: 'mcp', assetName: 'demo', host: getHost('claude-desktop')!,
      resolvedSource: { type: 'inline-json', localPath: '', originalSource: '{}' },
    };
    expect(() => convertMcpServer(job, { url: 'https://example.com/mcp' }, 'demo')).toThrow('local stdio');
    expect(() => convertMcpServer(job, { command: ['node', 'server.js'] }, 'demo')).toThrow('string stdio command');
    expect(() => convertMcpServer(job, { command: 'node', unknown: true }, 'demo')).toThrow('cannot represent');
  });

  it('does not apply user overrides to project path selection', () => {
    const selected = selectHostScope(getHost('codex')!, 'project', cwd, { ...environment, env: { CODEX_HOME: './relative' } });
    expect(selected.assets.mcp.configFile).toBe(path.join(cwd, '.codex/config.toml'));
  });
});
