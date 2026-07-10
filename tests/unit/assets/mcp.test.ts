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
