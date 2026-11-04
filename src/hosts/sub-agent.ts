import yaml from 'yaml';
import { splitFrontmatter } from '../utils/frontmatter.js';
import type { HostAdapter, HostId } from './types.js';

export function applyHostHints(
  metadata: Record<string, unknown>,
  hostId: HostId,
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

export function formatSubAgent(host: HostAdapter, content: string, name: string): string {
  const { metadata, body, hasFrontmatter } = splitFrontmatter(content);
  const processed = applyHostHints(metadata, host.id);
  if (host.serializeSubAgent)
    return host.serializeSubAgent({ metadata: processed, body }, name);
  if (!hasFrontmatter) return body;
  return `---\n${yaml.stringify(processed).trimEnd()}\n---\n${body}`;
}
