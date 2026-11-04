import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { ResolvedSource } from '../assets/types.js';
import type { SourceType } from './detect.js';
import type { OnSourceProgress } from '../utils/progress.js';

const execFileAsync = promisify(execFile);

export interface ParsedGitSource {
  repoUrl: string;
  ref?: string;
  subPath?: string;
}

/**
 * Split a git source string into repo URL, optional @ref, and optional #subPath.
 *
 * Two ref orderings are supported:
 *   - `repo.git@ref#path` (the documented convention for user-supplied sources)
 *   - `repo.git#path@ref` (emitted by normalizeGitUrl for GitHub/GitLab
 *     `/tree/<ref>/<path>` web URLs)
 *
 * For non-SSH URLs, the @ref separator before `#` is only searched for within
 * the path segment (after the authority), so credentials embedded in the URL
 * (e.g. https://token@github.com/org/repo.git) are not mistaken for a ref
 * separator.
 */
export function parseGitSource(source: string): ParsedGitSource {
  // Step 1: split off #subPath
  const hashIdx = source.indexOf('#');
  const withoutPath = hashIdx !== -1 ? source.slice(0, hashIdx) : source;
  const rawSubPath = hashIdx !== -1 ? source.slice(hashIdx + 1) || undefined : undefined;

  // Step 2: split off @ref — for SSH URLs (git@host:...), skip the leading "git@" prefix.
  // For other URLs, only look for @ within the path segment, so userinfo
  // credentials (https://user:pass@host/... or https://token@host/...) aren't
  // mistaken for the ref separator.
  const isSSH = withoutPath.startsWith('git@');
  let searchFrom = 0;
  if (isSSH) {
    searchFrom = 4;
  } else {
    const schemeIdx = withoutPath.indexOf('://');
    if (schemeIdx !== -1) {
      const authorityStart = schemeIdx + 3;
      const pathStart = withoutPath.indexOf('/', authorityStart);
      searchFrom = pathStart !== -1 ? pathStart : withoutPath.length;
    }
  }
  const atIdx = withoutPath.indexOf('@', searchFrom);
  const repoUrl = atIdx !== -1 ? withoutPath.slice(0, atIdx) : withoutPath;
  let ref = atIdx !== -1 ? withoutPath.slice(atIdx + 1) || undefined : undefined;

  // Step 3: if no ref was found before `#`, check for a trailing @ref after
  // the subPath (the `#path@ref` ordering). A trailing ref never contains "/",
  // so a path segment like `packages/@scope/pkg` is left alone.
  let subPath = rawSubPath;
  if (!ref && rawSubPath) {
    const subAtIdx = rawSubPath.lastIndexOf('@');
    if (subAtIdx !== -1 && !rawSubPath.slice(subAtIdx + 1).includes('/')) {
      ref = rawSubPath.slice(subAtIdx + 1) || undefined;
      subPath = rawSubPath.slice(0, subAtIdx) || undefined;
    }
  }

  return { repoUrl, ref, subPath };
}

async function fetchGit(args: string[], onProgress?: OnSourceProgress): Promise<void> {
  onProgress?.({ phase: 'download', detail: 'fetching Git repository' });
  await new Promise<void>((resolve, reject) => {
    const child = spawn('git', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    let pending = '';
    child.stderr.setEncoding('utf-8');
    child.stderr.on('data', (chunk: string) => {
      stderr = (stderr + chunk).slice(-8192);
      const lines = (pending + chunk).split(/[\r\n]/);
      pending = lines.pop()!.slice(-2048);
      for (const line of lines) {
        if (/(?:Receiving objects|Resolving deltas|Counting objects|Compressing objects|Enumerating objects):/.test(line)) {
          onProgress?.({ phase: 'download', detail: line.trim() });
        }
      }
    });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`git fetch failed (${signal ?? code}): ${stderr.trim()}`));
    });
  });
}

export async function resolveGit(source: string, type: SourceType, onProgress?: OnSourceProgress): Promise<ResolvedSource> {
  const { repoUrl, ref, subPath } = parseGitSource(source);

  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-git-'));

  try {
    await execFileAsync('git', ['init', tmpDir]);
    await execFileAsync('git', ['-C', tmpDir, 'remote', 'add', 'origin', repoUrl]);

    const fetchTarget = ref ?? 'HEAD';

    if (subPath) {
      await execFileAsync('git', ['-C', tmpDir, 'config', 'core.sparseCheckout', 'true']);
      const sparseFile = path.join(tmpDir, '.git', 'info', 'sparse-checkout');
      await fs.promises.writeFile(sparseFile, subPath + '\n', 'utf-8');
    }
    await fetchGit(['-C', tmpDir, 'fetch', '--depth=1', '--progress', 'origin', fetchTarget], onProgress);
    onProgress?.({ phase: 'checkout' });
    await execFileAsync('git', ['-C', tmpDir, 'checkout', 'FETCH_HEAD']);

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
