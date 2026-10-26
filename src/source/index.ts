import type { ResolvedSource } from '../assets/types.js';
import { resolveLocal } from './local.js';
import { resolveGit } from './git.js';
import { resolveHttpFile } from './http-file.js';
import { resolveInlineJson, resolveInlineMd } from './inline.js';
import { inferName } from './infer-name.js';
import { normalizeGitUrl, detectSourceType } from './detect.js';

export { normalizeGitUrl, detectSourceType } from './detect.js';
export type { SourceType } from './detect.js';

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
