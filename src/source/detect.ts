import { parseGitSource } from './git.js';

export type SourceType = 'local' | 'git-ssh' | 'git-https' | 'http-file' | 'inline-json' | 'inline-md';

// The trailing (?:@ref)? and (?:/tree|blob/ref/path)? groups are matched against the
// part of the URL before any "#", so neither "@" nor "#" can leak into owner/repo.

// GitHub web URL: https://github.com/owner/repo[.git][@ref][/tree|blob/ref/path]
const GITHUB_WEB_RE = /^https?:\/\/(?:www\.)?github\.com\/([^/?#@]+\/[^/?#@]+?)(?:\.git)?(?:@([^/?#]+))?(?:\/(?:tree|blob)\/([^/?#]+)(?:\/([^?#]*?))?)?\/?$/;

// GitLab web URL: https://gitlab.com/owner/repo[.git][@ref][/-/tree|blob/ref/path]
const GITLAB_WEB_RE = /^https?:\/\/(?:www\.)?gitlab\.com\/([^/?#@]+\/[^/?#@]+?)(?:\.git)?(?:@([^/?#]+))?(?:\/(?:-\/)?(?:tree|blob)\/([^/?#]+)(?:\/([^?#]*?))?)?\/?$/;

const WEB_URL_PATTERNS: Array<{ re: RegExp; host: string }> = [
  { re: GITHUB_WEB_RE, host: 'github.com' },
  { re: GITLAB_WEB_RE, host: 'gitlab.com' },
];

/**
 * Normalize GitHub/GitLab web URLs into git-compatible URLs.
 *
 * - `/tree/<ref>/<path>` and `/blob/<ref>/<path>` become `repo.git#path@ref`
 *   (a "#" on these URLs is a page anchor and is dropped).
 * - Bare repo URLs gain a `.git` suffix and keep any user-supplied `@ref` / `#path`.
 *
 * Returns the original string unchanged if no pattern matches.
 */
export function normalizeGitUrl(source: string): string {
  // Skip inline JSON, inline Markdown, SSH URLs, local paths
  if (source.startsWith('{') || source.includes('\n') || source.startsWith('git@')) {
    return source;
  }

  const hashIdx = source.indexOf('#');
  const base = hashIdx === -1 ? source : source.slice(0, hashIdx);
  const fragment = hashIdx === -1 ? undefined : source.slice(hashIdx + 1);

  for (const { re, host } of WEB_URL_PATTERNS) {
    const match = re.exec(base);
    if (!match) continue;

    const [, ownerRepo, atRef, webRef, webPath] = match;
    const repoUrl = `https://${host}/${ownerRepo}.git`;

    if (webRef !== undefined) {
      let url = repoUrl;
      if (webPath) {
        url += `#${webPath}`;
      }
      return `${url}@${webRef}`;
    }

    let url = repoUrl;
    if (atRef) {
      url += `@${atRef}`;
    }
    if (fragment !== undefined) {
      url += `#${fragment}`;
    }
    return url;
  }

  return source;
}

function isGitRepoUrl(repoUrl: string): boolean {
  let pathname: string;
  try {
    pathname = new URL(repoUrl).pathname;
  } catch {
    pathname = repoUrl.split('?')[0] ?? repoUrl;
  }
  return /\.git\/?$/i.test(pathname);
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
    // A URL is a git source only when its repository part (with any @ref and
    // #subPath removed) ends in .git. Anything else is a plain file download,
    // so a "#" on an ordinary URL is just a fragment.
    const { repoUrl } = parseGitSource(normalizeGitUrl(source));
    return isGitRepoUrl(repoUrl) ? 'git-https' : 'http-file';
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
