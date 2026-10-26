import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runInstaller } from '../../src/installer.js';
import { getHost } from '../../src/hosts/index.js';

function listAgentAddTempDirs(): string[] {
  return fs
    .readdirSync(os.tmpdir())
    .filter((name) => name.startsWith('agent-add-http-'))
    .map((name) => path.join(os.tmpdir(), name));
}

describe('runInstaller temp-dir cleanup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('removes downloaded temp dirs even when validation fails', async () => {
    const before = new Set(listAgentAddTempDirs());

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('not json', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        }),
      ),
    );

    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(((code?: number) => {
        throw new Error(`process.exit(${code})`);
      }) as never);
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const host = getHost('claude-code')!;

    await expect(
      runInstaller(
        {
          // .txt extension fails MCP asset validation (must be .json)
          mcp: ['https://example.com/not-an-mcp-config.txt'],
          skill: [],
          prompt: [],
          command: [],
          subAgent: [],
          pack: [],
          host: 'claude-code',
        },
        host,
        process.cwd(),
      ),
    ).rejects.toThrow('process.exit(2)');

    expect(exitSpy).toHaveBeenCalledWith(2);

    const after = new Set(listAgentAddTempDirs());
    const leaked = [...after].filter((dir) => !before.has(dir));
    expect(leaked).toEqual([]);

    stderrSpy.mockRestore();
  });
});
