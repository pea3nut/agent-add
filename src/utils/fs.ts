import fs from 'fs';
import path from 'path';

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

/**
 * Read and parse a JSON file. Returns null only if the file doesn't exist —
 * any other error (permission denied, invalid JSON) is thrown, so callers
 * that default a missing file to `{}` don't also silently discard an
 * existing-but-malformed config and overwrite it.
 */
export async function readJSONOrNull<T = unknown>(filePath: string): Promise<T | null> {
  let content: string;
  try {
    content = await fs.promises.readFile(filePath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw err;
  }
  return JSON.parse(content) as T;
}

export async function atomicWriteJSON(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);

  const tmpPath = path.join(dir, `.agent-add-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
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
