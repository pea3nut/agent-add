import path from 'path';
import { unwrapMcpServers } from '../utils/unwrap-mcp-servers.js';

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
 * 1. If source contains `#path`, use last segment of path (minus extension, unless isDirectorySource)
 * 2. If git URL without #path (e.g. git@...repo.git), use repo name (strip .git)
 * 3. If local path or http-file URL, use filename without extension (unless isDirectorySource)
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

  // Git URL with #path: take the last path segment
  const hashIdx = s.indexOf('#');
  if (hashIdx !== -1) {
    const subPath = s.slice(hashIdx + 1);
    const segments = subPath.split('/').filter(Boolean);
    if (segments.length > 0) {
      const last = segments[segments.length - 1]!;
      return isDirectorySource ? last : stripExtension(last);
    }
  }

  // Git SSH/HTTPS without #path: use repo name (strip @ref before extension stripping)
  if (s.startsWith('git@') || (s.startsWith('https://') && s.includes('.git'))) {
    const urlPart = s.split('#')[0];
    const repoSegment = urlPart.split('/').pop() ?? urlPart.split(':').pop() ?? urlPart;
    const atIdx = (repoSegment ?? '').indexOf('@');
    const cleanSegment = atIdx !== -1 ? repoSegment!.slice(0, atIdx) : repoSegment;
    return stripExtension(cleanSegment ?? urlPart);
  }

  // Local path or HTTP file: use filename without extension
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
