import type { ResolvedSource } from '../assets/types.js';
import { resolveLocal } from './local.js';
import { resolveGit } from './git.js';
import { resolveHttpFile } from './http-file.js';
import { inferName } from './infer-name.js';

export type SourceType = 'local' | 'git-ssh' | 'git-https' | 'http-file';

// .git suffix: appears as .git at end, before #, or before /
const GIT_REPO_SUFFIX_RE = /\.git(\/|#|$)/;

export function detectSourceType(source: string): SourceType {
  if (source.startsWith('git@')) {
    return 'git-ssh';
  }
  if (source.startsWith('https://') || source.startsWith('http://')) {
    if (GIT_REPO_SUFFIX_RE.test(source) || source.includes('#')) {
      return 'git-https';
    }
    return 'http-file';
  }
  return 'local';
}

export async function resolveSource(source: string, cwd: string): Promise<ResolvedSource> {
  const type = detectSourceType(source);
  const assetName = inferName(source);

  switch (type) {
    case 'local':
      return resolveLocal(source, cwd);
    case 'git-ssh':
    case 'git-https':
      return resolveGit(source, type);
    case 'http-file':
      return resolveHttpFile(source, assetName);
  }
}
