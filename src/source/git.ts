import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { ResolvedSource } from '../assets/types.js';
import type { SourceType } from './index.js';

const execFileAsync = promisify(execFile);

export async function resolveGit(source: string, type: SourceType): Promise<ResolvedSource> {
  const hashIdx = source.indexOf('#');
  let repoUrl: string;
  let subPath: string | undefined;

  if (hashIdx !== -1) {
    repoUrl = source.slice(0, hashIdx);
    subPath = source.slice(hashIdx + 1);
  } else {
    repoUrl = source;
    subPath = undefined;
  }

  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-get-git-'));

  try {
    await execFileAsync('git', ['init', tmpDir]);
    await execFileAsync('git', ['-C', tmpDir, 'remote', 'add', 'origin', repoUrl]);

    if (subPath) {
      await execFileAsync('git', ['-C', tmpDir, 'config', 'core.sparseCheckout', 'true']);
      const sparseFile = path.join(tmpDir, '.git', 'info', 'sparse-checkout');
      await fs.promises.writeFile(sparseFile, subPath + '\n', 'utf-8');
      await execFileAsync('git', ['-C', tmpDir, 'fetch', '--depth=1', 'origin', 'HEAD']);
      await execFileAsync('git', ['-C', tmpDir, 'checkout', 'FETCH_HEAD']);
    } else {
      await execFileAsync('git', ['-C', tmpDir, 'fetch', '--depth=1', 'origin', 'HEAD']);
      await execFileAsync('git', ['-C', tmpDir, 'checkout', 'FETCH_HEAD']);
    }

    const localPath = subPath ? path.join(tmpDir, subPath) : tmpDir;

    return {
      type,
      localPath,
      originalSource: source,
      tempDir: tmpDir,
    };
  } catch (err) {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
    throw new Error(
      `Failed to clone git repository: ${repoUrl}\n  Cause: ${(err as Error).message}`,
    );
  }
}
