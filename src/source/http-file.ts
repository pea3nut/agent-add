import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import type { ResolvedSource } from '../assets/types.js';
import type { OnSourceProgress } from '../utils/progress.js';

export async function resolveHttpFile(source: string, assetName: string, onProgress?: OnSourceProgress): Promise<ResolvedSource> {
  onProgress?.({ phase: 'download', receivedBytes: 0 });
  let response: Response;
  try {
    response = await fetch(source);
  } catch (err) {
    throw new Error(
      `Failed to fetch HTTP source: ${source}\n  Cause: ${(err as Error).message}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `HTTP request failed: ${source}\n  Status: ${response.status} ${response.statusText}`,
    );
  }

  // Query and fragment are kept in the request above but never in the filename.
  const urlPath = new URL(source).pathname;
  const ext = path.extname(urlPath) || '.tmp';
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-http-'));
  const tmpFile = path.join(tmpDir, `${assetName}${ext}`);

  try {
    // Fetch decodes compressed bodies, so their Content-Length is not a byte total.
    const length = Number(response.headers.get('content-length'));
    const totalBytes = !response.headers.get('content-encoding') && Number.isSafeInteger(length) && length > 0
      ? length : undefined;
    let receivedBytes = 0;
    onProgress?.({ phase: 'download', receivedBytes, totalBytes });
    async function* chunks() {
      const reader = response.body?.getReader();
      if (!reader) return;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          receivedBytes += value.byteLength;
          onProgress?.({ phase: 'download', receivedBytes, totalBytes });
          yield value;
        }
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    }
    await pipeline(Readable.from(chunks()), fs.createWriteStream(tmpFile));
    onProgress?.({ phase: 'download', receivedBytes, totalBytes, done: true });
  } catch (err) {
    await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }

  return {
    type: 'http-file',
    localPath: tmpFile,
    originalSource: source,
    tempDir: tmpDir,
  };
}
