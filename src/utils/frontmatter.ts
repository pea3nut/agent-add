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
  const closing = normalized.match(/\n(---[\t ]*)(?:\n|$)/);
  if (!closing) throw new Error('Unterminated YAML frontmatter');
  const file = matter(normalized + '\n', {
    delimiters: ['---', closing[1] + '\n'],
    engines: { yaml: yaml.parse },
  });
  const parsed: unknown = file.data;
  if (parsed !== null && !isRecord(parsed))
    throw new Error('Frontmatter must be a YAML mapping');
  return {
    metadata: parsed ?? {},
    body: normalized.slice(3 + file.matter.length + closing[0].length),
    hasFrontmatter: true,
  };
}
