import type { ResolvedSource } from '../assets/types.js';
import { resolveLocal } from './local.js';
import { resolveGit } from './git.js';
import { resolveHttpFile } from './http-file.js';
import { resolveInlineJson, resolveInlineMd } from './inline.js';
import { inferName } from './infer-name.js';

export type SourceType = 'local' | 'git-ssh' | 'git-https' | 'http-file' | 'inline-json' | 'inline-md';

// .git suffix: appears as .git at end, before #, @, or /
const GIT_REPO_SUFFIX_RE = /\.git(\/|@|#|$)/;

// GitHub shorthand: owner/repo or owner/repo#path
const GITHUB_SHORTHAND_RE = /^([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)(#.*)?$/;

// GitHub web URL: https://github.com/owner/repo[/tree|blob/ref/path]
const GITHUB_WEB_RE = /^https?:\/\/(www\.)?github\.com\/([^/#]+\/[^/#]+?)(?:\.git)?\/?(?:\/(tree|blob)\/([^/]+)\/?(.*?))?$/;

// GitLab web URL: https://gitlab.com/owner/repo[/-/tree|blob/ref/path]
const GITLAB_WEB_RE = /^https?:\/\/(www\.)?gitlab\.com\/([^/#]+\/[^/#]+?)(?:\.git)?\/?(?:\/(?:-\/)?(tree|blob)\/([^/]+)\/?(.*?))?$/;

/**
 * Normalize GitHub/GitLab web URLs and shorthand syntax into git-compatible URLs.
 * Returns the original string unchanged if no pattern matches.
 */
export function normalizeGitUrl(source: string): string {
  // Skip inline JSON, inline Markdown, SSH URLs, local paths
  if (source.startsWith('{') || source.includes('\n') || source.startsWith('git@')) {
    return source;
  }

  // GitHub shorthand: owner/repo or owner/repo#path
  const shorthandMatch = GITHUB_SHORTHAND_RE.exec(source);
  if (shorthandMatch) {
    const ownerRepo = shorthandMatch[1];
    const fragment = shorthandMatch[2] ?? ''; // #path if present
    return `https://github.com/${ownerRepo}.git${fragment}`;
  }

  // GitHub web URL
  const ghMatch = GITHUB_WEB_RE.exec(source);
  if (ghMatch) {
    const ownerRepo = ghMatch[2];
    const ref = ghMatch[4];
    const subPath = ghMatch[5];
    let url = `https://github.com/${ownerRepo}.git`;
    if (subPath) {
      url += `#${subPath}`;
    }
    if (ref) {
      url += `@${ref}`;
    }
    return url;
  }

  // GitLab web URL
  const glMatch = GITLAB_WEB_RE.exec(source);
  if (glMatch) {
    const ownerRepo = glMatch[2];
    const ref = glMatch[4];
    const subPath = glMatch[5];
    let url = `https://gitlab.com/${ownerRepo}.git`;
    if (subPath) {
      url += `#${subPath}`;
    }
    if (ref) {
      url += `@${ref}`;
    }
    return url;
  }

  return source;
}

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
  const trimmed = source.trim(); // normalize: remove leading/trailing whitespace or BOM
  const normalizedSource = normalizeGitUrl(trimmed);
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
