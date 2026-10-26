import fs from 'fs';
import path from 'path';
import os from 'os';
import type { ResolvedSource } from '../assets/types.js';
import { unwrapMcpServers } from '../utils/unwrap-mcp-servers.js';

export async function resolveInlineJson(source: string, _assetName: string): Promise<ResolvedSource> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error(
      `Failed to parse inline JSON. Expected format: {"<name>":{...}}, e.g.: {"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}`,
    );
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Inline JSON must be an object, got: ${JSON.stringify(parsed)}`);
  }

  const obj = parsed as Record<string, unknown>;
  let value: unknown;

  const unwrapped = unwrapMcpServers(obj);
  if (unwrapped) {
    value = unwrapped.config;
  } else {
    const entries = Object.entries(obj);
    if (entries.length !== 1) {
      throw new Error(
        `Inline JSON must contain exactly one key (used as the asset name), got ${entries.length} keys`,
      );
    }
    [, value] = entries[0]!;
  }

  return writeInline(source, JSON.stringify(value, null, 2), 'json');
}

export async function resolveInlineMd(source: string, _assetName: string): Promise<ResolvedSource> {
  return writeInline(source, source, 'md');
}

async function writeInline(source: string, content: string, extension: 'json' | 'md'): Promise<ResolvedSource> {
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-inline-'));
  const tmpFile = path.join(tmpDir, `asset.${extension}`);
  try {
    await fs.promises.writeFile(tmpFile, content);
  } catch (err) {
    await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }

  return {
    type: extension === 'json' ? 'inline-json' : 'inline-md',
    localPath: tmpFile,
    originalSource: source,
    tempDir: tmpDir,
  };
}
