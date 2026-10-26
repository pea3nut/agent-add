import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { resolveSource } from '../../../src/source/index.js';

describe('resolveSource - HTTP files', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const variants = [
    'https://example.com/prompts/review.md',
    'https://example.com/prompts/review.md?raw=1',
    'https://example.com/prompts/review.md#usage',
    'https://example.com/prompts/review.md?raw=1#usage',
  ];

  for (const source of variants) {
    it(`downloads ${source} as review.md and keeps the query in the request`, async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response('# Review\n', { status: 200 }));
      vi.stubGlobal('fetch', fetchMock);

      const resolved = await resolveSource(source, process.cwd());
      try {
        expect(resolved.type).toBe('http-file');
        expect(path.basename(resolved.localPath)).toBe('review.md');
        expect(await fs.promises.readFile(resolved.localPath, 'utf-8')).toBe('# Review\n');

        const requested = new URL(String(fetchMock.mock.calls[0]![0]));
        expect(requested.pathname).toBe('/prompts/review.md');
        expect(requested.search).toBe(new URL(source).search);
      } finally {
        await fs.promises.rm(resolved.tempDir!, { recursive: true, force: true });
      }
    });
  }

  it('does not create a temp dir when reading the response body fails', async () => {
    const response = new Response('x', { status: 200 });
    vi.spyOn(response, 'arrayBuffer').mockRejectedValue(new Error('connection reset'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    const mkdtemp = vi.spyOn(fs.promises, 'mkdtemp');

    await expect(resolveSource('https://example.com/prompts/review.md', process.cwd())).rejects.toThrow(
      'connection reset',
    );
    expect(mkdtemp).not.toHaveBeenCalled();
    mkdtemp.mockRestore();
  });
});
