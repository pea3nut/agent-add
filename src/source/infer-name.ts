import path from 'path';

/**
 * Infer asset name from source string.
 *
 * Rules:
 * 0. If inline JSON (starts with `{`): extract the single top-level key
 * 0. If inline Markdown (contains `\n`): extract first `# Heading` and kebab-case it
 * 1. If source contains `#path`, use last segment of path (minus extension)
 * 2. If git URL without #path (e.g. git@...repo.git), use repo name (strip .git)
 * 3. If local path or http-file URL, use filename without extension
 */
export function inferName(source: string): string {
  // Inline JSON: extract single top-level key as name
  if (source.startsWith('{')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(source);
    } catch {
      throw new Error(
        `内联 JSON 解析失败。格式应为 {"<name>":{...}}，例如：{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}`,
      );
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error(`内联 JSON 必须为对象类型`);
    }
    const keys = Object.keys(parsed as Record<string, unknown>);
    if (keys.length !== 1) {
      throw new Error(
        `内联 JSON 必须包含恰好一个 key（作为资产名称），当前有 ${keys.length} 个 key`,
      );
    }
    return keys[0]!;
  }

  // Inline Markdown: extract first `# Heading` and convert to kebab-case
  if (source.includes('\n')) {
    for (const line of source.split('\n')) {
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
      `内联 Markdown 必须包含一级标题（如 # My Prompt）以推断资产名称`,
    );
  }

  // Git URL with #path: take the last path segment
  const hashIdx = source.indexOf('#');
  if (hashIdx !== -1) {
    const subPath = source.slice(hashIdx + 1);
    const segments = subPath.split('/').filter(Boolean);
    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      return stripExtension(last);
    }
  }

  // Git SSH/HTTPS without #path: use repo name (strip @ref before extension stripping)
  if (source.startsWith('git@') || (source.startsWith('https://') && source.includes('.git'))) {
    const urlPart = source.split('#')[0];
    const repoSegment = urlPart.split('/').pop() ?? urlPart.split(':').pop() ?? urlPart;
    const atIdx = (repoSegment ?? '').indexOf('@');
    const cleanSegment = atIdx !== -1 ? repoSegment!.slice(0, atIdx) : repoSegment;
    return stripExtension(cleanSegment ?? urlPart);
  }

  // Local path or HTTP file: use filename without extension
  const basename = path.basename(source.split('?')[0] ?? source);
  return stripExtension(basename);
}

function stripExtension(filename: string): string {
  const dotIdx = filename.lastIndexOf('.');
  if (dotIdx > 0) {
    return filename.slice(0, dotIdx);
  }
  return filename;
}
