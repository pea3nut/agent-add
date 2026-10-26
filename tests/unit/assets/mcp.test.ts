import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { mcpHandler } from '../../../src/assets/mcp.js';
import type { InstallJob } from '../../../src/assets/types.js';
import type { HostConfig } from '../../../src/hosts/types.js';

async function makeTmpDir(): Promise<string> {
  return fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-mcp-test-'));
}

function makeHost(configFilePath: string, hostId = 'codex'): HostConfig {
  return {
    id: hostId,
    displayName: hostId,
    docs: '',
    detection: { paths: [] },
    assets: {
      mcp: {
        supported: true,
        configFile: configFilePath,
        configKey: 'mcpServers',
        writeStrategy: 'inject-json-key',
      },
      skill: { supported: false },
      prompt: { supported: false },
      command: { supported: false },
      subAgent: { supported: false },
    },
  } as HostConfig;
}

async function cleanup(tmpDir: string): Promise<void> {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
}

describe('mcpHandler - TOML hosts (regression)', () => {
  it('writes the unwrapped mcpServers name, not the stale pre-unwrap assetName', async () => {
    const tmpDir = await makeTmpDir();
    const sourcePath = path.join(tmpDir, 'wrapped-source.json');
    await fs.promises.writeFile(
      sourcePath,
      JSON.stringify({ mcpServers: { playwright: { command: 'npx', args: ['-y', '@playwright/mcp'] } } }),
    );
    const configFilePath = path.join(tmpDir, 'config.toml');
    const host = makeHost(configFilePath);

    const job: InstallJob = {
      assetType: 'mcp',
      assetName: 'wrapped-source', // the (wrong) name inferred from the source filename
      resolvedSource: { type: 'local', localPath: sourcePath, originalSource: sourcePath },
      host,
    };

    const result = await mcpHandler.handle(job);
    expect(result.status).toBe('written');

    const toml = await fs.promises.readFile(configFilePath, 'utf-8');
    expect(toml).toContain('playwright');
    expect(toml).not.toContain('wrapped-source');

    await cleanup(tmpDir);
  });

  it('reports conflict (not exists) when a differently-configured entry already exists at the same name', async () => {
    const tmpDir = await makeTmpDir();
    const sourcePath = path.join(tmpDir, 'playwright.json');
    await fs.promises.writeFile(sourcePath, JSON.stringify({ command: 'npx', args: ['-y', '@playwright/mcp'] }));
    const configFilePath = path.join(tmpDir, 'config.toml');
    await fs.promises.writeFile(configFilePath, '[mcp_servers.playwright]\ncommand = "different-command"\n');
    const host = makeHost(configFilePath);

    const job: InstallJob = {
      assetType: 'mcp',
      assetName: 'playwright',
      resolvedSource: { type: 'local', localPath: sourcePath, originalSource: sourcePath },
      host,
    };

    const result = await mcpHandler.handle(job);
    expect(result.status).toBe('conflict');

    await cleanup(tmpDir);
  });

  it('reports exists (not conflict) once the identical entry has already been written', async () => {
    const tmpDir = await makeTmpDir();
    const sourcePath = path.join(tmpDir, 'playwright.json');
    await fs.promises.writeFile(sourcePath, JSON.stringify({ command: 'npx' }));
    const configFilePath = path.join(tmpDir, 'config.toml');
    const host = makeHost(configFilePath);
    const job: InstallJob = {
      assetType: 'mcp',
      assetName: 'playwright',
      resolvedSource: { type: 'local', localPath: sourcePath, originalSource: sourcePath },
      host,
    };

    const first = await mcpHandler.handle(job);
    expect(first.status).toBe('written');

    const second = await mcpHandler.handle(job);
    expect(second.status).toBe('exists');

    await cleanup(tmpDir);
  });

  it('vibe array format: reports conflict for a same-name entry with different content', async () => {
    const tmpDir = await makeTmpDir();
    const sourcePath = path.join(tmpDir, 'playwright.json');
    await fs.promises.writeFile(sourcePath, JSON.stringify({ command: 'npx' }));
    const configFilePath = path.join(tmpDir, 'config.toml');
    await fs.promises.writeFile(
      configFilePath,
      '[[mcp_servers]]\nname = "playwright"\ntransport = "stdio"\ncommand = "different"\n',
    );
    const host = makeHost(configFilePath, 'vibe');
    const job: InstallJob = {
      assetType: 'mcp',
      assetName: 'playwright',
      resolvedSource: { type: 'local', localPath: sourcePath, originalSource: sourcePath },
      host,
    };

    const result = await mcpHandler.handle(job);
    expect(result.status).toBe('conflict');

    await cleanup(tmpDir);
  });

  it('vibe array format: reports exists once the identical entry has already been written', async () => {
    const tmpDir = await makeTmpDir();
    const sourcePath = path.join(tmpDir, 'playwright.json');
    await fs.promises.writeFile(sourcePath, JSON.stringify({ command: 'npx' }));
    const configFilePath = path.join(tmpDir, 'config.toml');
    const host = makeHost(configFilePath, 'vibe');
    const job: InstallJob = {
      assetType: 'mcp',
      assetName: 'playwright',
      resolvedSource: { type: 'local', localPath: sourcePath, originalSource: sourcePath },
      host,
    };

    const first = await mcpHandler.handle(job);
    expect(first.status).toBe('written');
    const second = await mcpHandler.handle(job);
    expect(second.status).toBe('exists');

    await cleanup(tmpDir);
  });
});

describe('mcpHandler - TOML content comparison ignores key order', () => {
  async function runAgainstExisting(
    hostId: 'codex' | 'vibe',
    source: Record<string, unknown>,
    existingToml: string,
  ): Promise<{ status: string; before: string; after: string }> {
    const tmpDir = await makeTmpDir();
    try {
      const sourcePath = path.join(tmpDir, 'playwright.json');
      await fs.promises.writeFile(sourcePath, JSON.stringify(source));
      const configFilePath = path.join(tmpDir, 'config.toml');
      await fs.promises.writeFile(configFilePath, existingToml);
      const job: InstallJob = {
        assetType: 'mcp',
        assetName: 'playwright',
        resolvedSource: { type: 'local', localPath: sourcePath, originalSource: sourcePath },
        host: makeHost(configFilePath, hostId),
      };
      const result = await mcpHandler.handle(job);
      const after = await fs.promises.readFile(configFilePath, 'utf-8');
      return { status: result.status, before: existingToml, after };
    } finally {
      await cleanup(tmpDir);
    }
  }

  const source = {
    command: 'npx',
    args: ['-y', '@playwright/mcp'],
    env: { API_KEY: 'k', NESTED_ORDER: 'x', DEBUG: '1' },
  };

  it('codex: reordered top-level keys are exists, file untouched', async () => {
    const toml = [
      '[mcp_servers.playwright]',
      'args = ["-y", "@playwright/mcp"]',
      'command = "npx"',
      '',
      '[mcp_servers.playwright.env]',
      'API_KEY = "k"',
      'NESTED_ORDER = "x"',
      'DEBUG = "1"',
      '',
    ].join('\n');
    const { status, before, after } = await runAgainstExisting('codex', source, toml);
    expect(status).toBe('exists');
    expect(after).toBe(before);
  });

  it('codex: reordered nested env keys are exists, file untouched', async () => {
    const toml = [
      '[mcp_servers.playwright]',
      'command = "npx"',
      'args = ["-y", "@playwright/mcp"]',
      '',
      '[mcp_servers.playwright.env]',
      'DEBUG = "1"',
      'API_KEY = "k"',
      'NESTED_ORDER = "x"',
      '',
    ].join('\n');
    const { status, before, after } = await runAgainstExisting('codex', source, toml);
    expect(status).toBe('exists');
    expect(after).toBe(before);
  });

  it('codex: a changed env value is a conflict, file untouched', async () => {
    const toml = [
      '[mcp_servers.playwright]',
      'command = "npx"',
      'args = ["-y", "@playwright/mcp"]',
      '',
      '[mcp_servers.playwright.env]',
      'DEBUG = "0"',
      'API_KEY = "k"',
      'NESTED_ORDER = "x"',
      '',
    ].join('\n');
    const { status, before, after } = await runAgainstExisting('codex', source, toml);
    expect(status).toBe('conflict');
    expect(after).toBe(before);
  });

  it('codex: reordered args are a conflict (array order is significant), file untouched', async () => {
    const toml = [
      '[mcp_servers.playwright]',
      'command = "npx"',
      'args = ["@playwright/mcp", "-y"]',
      '',
      '[mcp_servers.playwright.env]',
      'API_KEY = "k"',
      'NESTED_ORDER = "x"',
      'DEBUG = "1"',
      '',
    ].join('\n');
    const { status, before, after } = await runAgainstExisting('codex', source, toml);
    expect(status).toBe('conflict');
    expect(after).toBe(before);
  });

  const vibeSource = { command: 'npx', args: ['-y', '@playwright/mcp'] };

  it('vibe: reordered name/transport/command fields are exists, file untouched', async () => {
    const toml = [
      '[[mcp_servers]]',
      'command = "npx"',
      'args = ["-y", "@playwright/mcp"]',
      'transport = "stdio"',
      'name = "playwright"',
      '',
    ].join('\n');
    const { status, before, after } = await runAgainstExisting('vibe', vibeSource, toml);
    expect(status).toBe('exists');
    expect(after).toBe(before);
  });

  it('vibe: a changed command is a conflict, file untouched', async () => {
    const toml = [
      '[[mcp_servers]]',
      'transport = "stdio"',
      'name = "playwright"',
      'command = "bunx"',
      'args = ["-y", "@playwright/mcp"]',
      '',
    ].join('\n');
    const { status, before, after } = await runAgainstExisting('vibe', vibeSource, toml);
    expect(status).toBe('conflict');
    expect(after).toBe(before);
  });

  it('vibe: reordered args are a conflict, file untouched', async () => {
    const toml = [
      '[[mcp_servers]]',
      'name = "playwright"',
      'transport = "stdio"',
      'command = "npx"',
      'args = ["@playwright/mcp", "-y"]',
      '',
    ].join('\n');
    const { status, before, after } = await runAgainstExisting('vibe', vibeSource, toml);
    expect(status).toBe('conflict');
    expect(after).toBe(before);
  });
});

describe('mcpHandler - JSON hosts (regression)', () => {
  it('reports error instead of silently discarding a malformed existing config', async () => {
    const tmpDir = await makeTmpDir();
    const sourcePath = path.join(tmpDir, 'playwright.json');
    await fs.promises.writeFile(sourcePath, JSON.stringify({ command: 'npx' }));
    const configFilePath = path.join(tmpDir, 'mcp.json');
    // malformed JSON (trailing comma) — this file has real, pre-existing content
    await fs.promises.writeFile(configFilePath, '{"mcpServers":{"existing-tool":{"command":"echo"},}}');
    const host = makeHost(configFilePath);
    const job: InstallJob = {
      assetType: 'mcp',
      assetName: 'playwright',
      resolvedSource: { type: 'local', localPath: sourcePath, originalSource: sourcePath },
      host,
    };

    const result = await mcpHandler.handle(job);
    expect(result.status).toBe('error');

    // The malformed file must be left untouched, not silently overwritten
    const stillThere = await fs.promises.readFile(configFilePath, 'utf-8');
    expect(stillThere).toContain('existing-tool');

    await cleanup(tmpDir);
  });
});
