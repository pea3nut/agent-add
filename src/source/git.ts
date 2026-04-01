import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { ResolvedSource } from '../assets/types.js';
import type { SourceType } from './index.js';

const execFileAsync = promisify(execFile);

export async function resolveGit(source: string, type: SourceType): Promise<ResolvedSource> {
  // Step 1: split off #subPath
  const hashIdx = source.indexOf('#');
  const withoutPath = hashIdx !== -1 ? source.slice(0, hashIdx) : source;
  const subPath = hashIdx !== -1 ? source.slice(hashIdx + 1) || undefined : undefined;

  // Step 2: split off @ref — for SSH URLs (git@host:...), skip the leading "git@" prefix
  const isSSH = withoutPath.startsWith('git@');
  const searchFrom = isSSH ? 4 : 0;
  const atIdx = withoutPath.indexOf('@', searchFrom);
  const repoUrl = atIdx !== -1 ? withoutPath.slice(0, atIdx) : withoutPath;
  const ref = atIdx !== -1 ? withoutPath.slice(atIdx + 1) || undefined : undefined;

  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-git-'));

  try {
    await execFileAsync('git', ['init', tmpDir]);
    await execFileAsync('git', ['-C', tmpDir, 'remote', 'add', 'origin', repoUrl]);

    const fetchTarget = ref ?? 'HEAD';

    if (subPath) {
      await execFileAsync('git', ['-C', tmpDir, 'config', 'core.sparseCheckout', 'true']);
      const sparseFile = path.join(tmpDir, '.git', 'info', 'sparse-checkout');
      await fs.promises.writeFile(sparseFile, subPath + '\n', 'utf-8');
      await execFileAsync('git', ['-C', tmpDir, 'fetch', '--depth=1', 'origin', fetchTarget]);
      await execFileAsync('git', ['-C', tmpDir, 'checkout', 'FETCH_HEAD']);
    } else {
      await execFileAsync('git', ['-C', tmpDir, 'fetch', '--depth=1', 'origin', fetchTarget]);
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
