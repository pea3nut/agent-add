import matter from 'gray-matter';
import yaml from 'yaml';
import { isRecord } from './config.js';

export function splitFrontmatter(content: string): {
  metadata: Record<string, unknown>;
  body: string;
  hasFrontmatter: boolean;
} {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!/^---[\t ]*(?:\n|$)/.test(normalized)) {
    return { metadata: {}, body: normalized, hasFrontmatter: false };
  }
  const file = matter(normalized, { engines: { yaml: yaml.parse } });
  const end = 3 + file.matter.length;
  const closing = normalized.slice(end).match(/^\n---[\t ]*(?:\n|$)/);
  if (!closing) throw new Error('Unterminated YAML frontmatter');
  const parsed: unknown = file.data;
  if (parsed !== null && !isRecord(parsed))
    throw new Error('Frontmatter must be a YAML mapping');
  return {
    metadata: parsed ?? {},
    body: normalized.slice(end + closing[0].length),
    hasFrontmatter: true,
  };
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
