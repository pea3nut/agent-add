import fs from 'fs';
import path from 'path';
import os from 'os';

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

export async function readJSONOrNull<T = unknown>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function atomicWriteJSON(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);

  const tmpPath = path.join(os.tmpdir(), `agent-add-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
  const content = JSON.stringify(data, null, 2) + '\n';

  try {
    await fs.promises.writeFile(tmpPath, content, 'utf-8');
    await fs.promises.rename(tmpPath, filePath);
  } catch (err) {
    try {
      await fs.promises.unlink(tmpPath);
    } catch {
      // ignore cleanup error
    }
    throw err;
  }
}
