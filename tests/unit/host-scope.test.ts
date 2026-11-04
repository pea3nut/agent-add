import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import { getAllHosts, getHost, getValidHostIds } from '../../src/hosts/index.js';
import { HostId, type HostAdapter } from '../../src/hosts/types.js';
import { selectHostScope } from '../../src/hosts/scope.js';
import { convertMcpServer } from '../../src/hosts/mcp-source.js';
import type { InstallJob } from '../../src/assets/types.js';

describe('scope path selection', () => {
  const home = path.resolve('test-home');
  const cwd = path.resolve('test-project');
  const environment = { home, env: {}, platform: 'linux' as const };

  it('registers every enum ID exactly once and rejects unknown CLI IDs', () => {
    const ids = Object.values(HostId).sort();
    expect(getValidHostIds().sort()).toEqual(ids);
    expect(getAllHosts().map((host) => host.id).sort()).toEqual(ids);
    expect(getHost('unknown-host')).toBeUndefined();
  });

  it('delegates user capabilities to the adapter and fills unsupported gaps', () => {
    const userAssets = vi.fn(() => ({
      skill: { supported: true, installDir: path.join(home, 'custom-skills') },
    }));
    const host: HostAdapter = { ...getHost(HostId.Cursor)!, userAssets };
    const selected = selectHostScope(host, 'user', cwd, environment);
    expect(userAssets).toHaveBeenCalledExactlyOnceWith(environment);
    expect(selected.assets.skill.installDir).toBe(path.join(home, 'custom-skills'));
    expect(selected.assets.mcp.supported).toBe(false);
    expect(host.assets.skill.installDir).toBe('.cursor/skills/');
  });

  it('never invokes the user factory for project scope', () => {
    const userAssets = vi.fn(() => { throw new Error('user-only factory'); });
    const host: HostAdapter = { ...getHost(HostId.Cursor)!, userAssets };
    const selected = selectHostScope(host, 'project', cwd, environment);
    expect(userAssets).not.toHaveBeenCalled();
    expect(selected.assets.skill.installDir).toBe(path.join(cwd, '.cursor/skills'));
  });

  it('preserves adapter hooks when selecting either scope', () => {
    const host: HostAdapter = {
      ...getHost(HostId.Cursor)!,
      mcp: { convert: vi.fn(() => ({})) },
      serializeSubAgent: vi.fn(() => 'native content'),
      serializeCommand: vi.fn((content: string) => content),
      registerPrompt: vi.fn(async () => null),
      resolvePromptTarget: vi.fn(async () => 'native target'),
    };
    for (const scope of ['project', 'user'] as const) {
      const selected = selectHostScope(host, scope, cwd, environment);
      expect(selected.mcp).toBe(host.mcp);
      expect(selected.serializeSubAgent).toBe(host.serializeSubAgent);
      expect(selected.serializeCommand).toBe(host.serializeCommand);
      expect(selected.registerPrompt).toBe(host.registerPrompt);
      expect(selected.resolvePromptTarget).toBe(host.resolvePromptTarget);
    }
  });

  it('delegates normalized MCP input to the selected adapter', () => {
    const convert = vi.fn(() => ({ native: true }));
    const host: HostAdapter = { ...getHost(HostId.Cursor)!, mcp: { convert } };
    const job: InstallJob = {
      assetType: 'mcp', assetName: 'demo', host,
      resolvedSource: { type: 'inline-json', localPath: '', originalSource: '{}' },
    };
    const source = { command: 'node', environment: { MODE: 'test' } };
    expect(convertMcpServer(job.host, source, 'demo')).toEqual({ native: true });
    expect(convert).toHaveBeenCalledExactlyOnceWith({
      source, command: 'node', args: undefined, env: { MODE: 'test' },
      url: undefined, transport: undefined, nativeHttp: false,
    }, 'demo');
  });

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
    expect(convertMcpServer(job.host, { command: 'node', args: ['server.js'], environment: { MODE: 'test' }, type: 'stdio' }, 'demo'))
      .toEqual({ command: 'node', args: ['server.js'], env: { MODE: 'test' } });
  });

  it('rejects remote and unrepresentable Claude Desktop MCP entries', () => {
    const job: InstallJob = {
      assetType: 'mcp', assetName: 'demo', host: getHost('claude-desktop')!,
      resolvedSource: { type: 'inline-json', localPath: '', originalSource: '{}' },
    };
    expect(() => convertMcpServer(job.host, { url: 'https://example.com/mcp' }, 'demo')).toThrow('local stdio');
    expect(() => convertMcpServer(job.host, { command: ['node', 'server.js'] }, 'demo')).toThrow('string stdio command');
    expect(() => convertMcpServer(job.host, { command: 'node', unknown: true }, 'demo')).toThrow('cannot represent');
  });

  it('does not apply user overrides to project path selection', () => {
    const selected = selectHostScope(getHost('codex')!, 'project', cwd, { ...environment, env: { CODEX_HOME: './relative' } });
    expect(selected.assets.mcp.configFile).toBe(path.join(cwd, '.codex/config.toml'));
  });
});
