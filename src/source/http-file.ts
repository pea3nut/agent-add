import fs from 'fs';
import path from 'path';
import os from 'os';
import type { ResolvedSource } from '../assets/types.js';

export async function resolveHttpFile(source: string, assetName: string): Promise<ResolvedSource> {
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

  const urlPath = new URL(source).pathname;
  const ext = path.extname(urlPath) || '.tmp';
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-http-'));
  const tmpFile = path.join(tmpDir, `${assetName}${ext}`);

  const buffer = await response.arrayBuffer();
  await fs.promises.writeFile(tmpFile, Buffer.from(buffer));

  return {
    type: 'http-file',
    localPath: tmpFile,
    originalSource: source,
    tempDir: tmpDir,
  };
}
