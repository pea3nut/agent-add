import path from 'path';

/**
 * Infer asset name from source string.
 *
 * Rules:
 * 1. If source contains `#path`, use last segment of path (minus extension)
 * 2. If git URL without #path (e.g. git@...repo.git), use repo name (strip .git)
 * 3. If local path or http-file URL, use filename without extension
 */
export function inferName(source: string): string {
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

  // Git SSH/HTTPS without #path: use repo name
  if (source.startsWith('git@') || (source.startsWith('https://') && source.includes('.git'))) {
    const urlPart = source.split('#')[0];
    const repoSegment = urlPart.split('/').pop() ?? urlPart.split(':').pop() ?? urlPart;
    return stripExtension(repoSegment ?? urlPart);
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
