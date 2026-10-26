import path from 'path';
import { unwrapMcpServers } from '../utils/unwrap-mcp-servers.js';
import { detectSourceType, normalizeGitUrl } from './detect.js';
import { parseGitSource } from './git.js';

export interface InferNameOptions {
  /**
   * Set for sources that resolve to a directory (e.g. skill assets), where
   * the last path segment / basename IS the asset name and must not have a
   * trailing ".something" stripped as if it were a file extension.
   */
  isDirectorySource?: boolean;
}

/**
 * Infer asset name from source string.
 *
 * Rules:
 * 0. If inline JSON (starts with `{`): extract the single top-level key
 * 0. If inline Markdown (contains `\n`): extract first `# Heading` and kebab-case it
 * 1. If git source with a subPath (`#path`, `#path@ref`, or a GitHub/GitLab tree/blob URL),
 *    use the last segment of the parsed subPath (minus extension, unless isDirectorySource)
 * 2. If git source without a subPath (e.g. git@...repo.git), use repo name (strip .git)
 * 3. If http-file URL, use the last segment of the URL pathname, ignoring query and fragment
 *    (minus extension, unless isDirectorySource)
 * 4. If local path, use filename without extension (unless isDirectorySource)
 */
export function inferName(source: string, options: InferNameOptions = {}): string {
  const { isDirectorySource = false } = options;
  const s = source.trim(); // normalize: remove leading/trailing whitespace or BOM

  // Inline JSON: extract single top-level key as name
  if (s.startsWith('{')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(s);
    } catch {
      throw new Error(
        `Failed to parse inline JSON. Expected format: {"<name>":{...}}, e.g.: {"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}`,
      );
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error(`Inline JSON must be an object`);
    }
    const obj = parsed as Record<string, unknown>;
    const unwrapped = unwrapMcpServers(obj);
    if (unwrapped) {
      return unwrapped.name;
    }
    const keys = Object.keys(obj);
    if (keys.length !== 1) {
      throw new Error(
        `Inline JSON must contain exactly one key (used as the asset name), got ${keys.length} keys`,
      );
    }
    return keys[0]!;
  }

  // Inline Markdown: extract first `# Heading` and convert to kebab-case
  if (s.includes('\n')) {
    for (const line of s.split('\n')) {
      const match = /^#\s+(.+)/.exec(line.trim());
      if (match) {
        return match[1]!
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
    }
    throw new Error(
      `Inline Markdown must contain a level-1 heading (e.g. # My Prompt) to infer the asset name`,
    );
  }

  // Remote and local paths: normalize and parse exactly the way resolveSource
  // does, so equivalent spellings of the same source get the same name.
  const normalized = normalizeGitUrl(s);
  const type = detectSourceType(normalized);

  if (type === 'git-ssh' || type === 'git-https') {
    const { repoUrl, subPath } = parseGitSource(normalized);
    const segments = (subPath ?? '').split('/').filter(Boolean);
    if (segments.length > 0) {
      const last = segments[segments.length - 1]!;
      return isDirectorySource ? last : stripExtension(last);
    }
    // No #path: the whole repo is the asset, so use the repo name without .git
    const repoSegment = repoUrl.replace(/\/+$/, '').split(/[/:]/).pop() || repoUrl;
    return repoSegment.replace(/\.git$/i, '');
  }

  if (type === 'http-file') {
    // Name comes from the URL path only; query and fragment are ignored.
    let pathname: string;
    let hostname = '';
    try {
      const url = new URL(normalized);
      pathname = url.pathname;
      hostname = url.hostname;
    } catch {
      pathname = normalized.split(/[?#]/)[0] ?? normalized;
    }
    const basename = path.posix.basename(pathname) || hostname;
    return isDirectorySource ? basename : stripExtension(basename);
  }

  // Local path: use filename without extension
  const basename = path.basename(s.split('?')[0] ?? s);
  return isDirectorySource ? basename : stripExtension(basename);
}

function stripExtension(filename: string): string {
  const dotIdx = filename.lastIndexOf('.');
  if (dotIdx > 0) {
    return filename.slice(0, dotIdx);
  }
  return filename;
}
