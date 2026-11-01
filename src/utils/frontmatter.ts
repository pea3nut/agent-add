import yaml from 'yaml';
import { isRecord } from './config.js';

export function splitFrontmatter(content: string): {
  metadata: Record<string, unknown>;
  body: string;
  hasFrontmatter: boolean;
} {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = normalized.match(
    /^---[\t ]*\n([\s\S]*?\n)?---[\t ]*(?:\n|$)([\s\S]*)$/,
  );
  if (!match) {
    if (/^---[\t ]*(?:\n|$)/.test(normalized))
      throw new Error('Unterminated YAML frontmatter');
    return { metadata: {}, body: normalized, hasFrontmatter: false };
  }
  const parsed: unknown = yaml.parse(match[1] ?? '');
  if (parsed !== null && !isRecord(parsed))
    throw new Error('Frontmatter must be a YAML mapping');
  return { metadata: parsed ?? {}, body: match[2]!, hasFrontmatter: true };
}

export function applyHostHints(
  metadata: Record<string, unknown>,
  hostId: string,
): Record<string, unknown> {
  const prefix = 'agent-add/' + hostId + '/';
  return Object.fromEntries([
    ...Object.entries(metadata).filter(
      ([key]) => !key.startsWith('agent-add/'),
    ),
    ...Object.entries(metadata)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => [key.slice(prefix.length), value]),
  ]);
}
