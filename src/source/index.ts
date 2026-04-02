import type { ResolvedSource } from '../assets/types.js';
import { resolveLocal } from './local.js';
import { resolveGit } from './git.js';
import { resolveHttpFile } from './http-file.js';
import { resolveInlineJson, resolveInlineMd } from './inline.js';
import { inferName } from './infer-name.js';

export type SourceType = 'local' | 'git-ssh' | 'git-https' | 'http-file' | 'inline-json' | 'inline-md';

// .git suffix: appears as .git at end, before #, @, or /
const GIT_REPO_SUFFIX_RE = /\.git(\/|@|#|$)/;

export function detectSourceType(source: string): SourceType {
  const trimmed = source.trim();
  if (trimmed.startsWith('{')) {
    return 'inline-json';
  }
  if (source.includes('\n')) {
    return 'inline-md';
  }
  if (source.startsWith('git@')) {
    return 'git-ssh';
  }
  if (source.startsWith('https://') || source.startsWith('http://')) {
    if (GIT_REPO_SUFFIX_RE.test(source) || source.includes('#')) {
      return 'git-https';
    }
    return 'http-file';
  }
  // Fallback: try JSON.parse to handle edge cases where MSYS inserts a non-whitespace
  // invisible prefix character that `.trim()` alone cannot remove
  try {
    const parsed = JSON.parse(source);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return 'inline-json';
    }
  } catch {
    // not JSON, fall through to local
  }
  return 'local';
}

export async function resolveSource(source: string, cwd: string): Promise<ResolvedSource> {
  const normalizedSource = source.trim(); // normalize: remove leading/trailing whitespace or BOM
  const type = detectSourceType(normalizedSource);
  const assetName = inferName(normalizedSource);

  switch (type) {
    case 'inline-json':
      return resolveInlineJson(normalizedSource, assetName);
    case 'inline-md':
      return resolveInlineMd(normalizedSource, assetName);
    case 'local':
      return resolveLocal(normalizedSource, cwd);
    case 'git-ssh':
    case 'git-https':
      return resolveGit(normalizedSource, type);
    case 'http-file':
      return resolveHttpFile(normalizedSource, assetName);
  }
}
