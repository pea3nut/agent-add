import fs from 'fs';
import path from 'path';
import os from 'os';
import type { ResolvedSource } from '../assets/types.js';

export async function resolveInlineJson(source: string, assetName: string): Promise<ResolvedSource> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error(
      `内联 JSON 解析失败。格式应为 {"<name>":{...}}，例如：{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}`,
    );
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`内联 JSON 必须为对象类型，得到：${JSON.stringify(parsed)}`);
  }

  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length !== 1) {
    throw new Error(
      `内联 JSON 必须包含恰好一个 key（作为资产名称），当前有 ${entries.length} 个 key`,
    );
  }

  const [, value] = entries[0]!;

  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-inline-'));
  const tmpFile = path.join(tmpDir, `${assetName}.json`);
  await fs.promises.writeFile(tmpFile, JSON.stringify(value, null, 2));

  return {
    type: 'inline-json',
    localPath: tmpFile,
    originalSource: source,
    tempDir: tmpDir,
  };
}

export async function resolveInlineMd(source: string, assetName: string): Promise<ResolvedSource> {
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-inline-'));
  const tmpFile = path.join(tmpDir, `${assetName}.md`);
  await fs.promises.writeFile(tmpFile, source);

  return {
    type: 'inline-md',
    localPath: tmpFile,
    originalSource: source,
    tempDir: tmpDir,
  };
}
