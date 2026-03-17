import fs from 'fs';
import path from 'path';
import type { ResolvedSource } from '../assets/types.js';

export async function resolveLocal(source: string, cwd: string): Promise<ResolvedSource> {
  const localPath = path.resolve(cwd, source);

  try {
    await fs.promises.access(localPath);
  } catch {
    throw new Error(`Local source not found: ${localPath}`);
  }

  return {
    type: 'local',
    localPath,
    originalSource: source,
  };
}
