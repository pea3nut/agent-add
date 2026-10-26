import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { childPath } from '../utils/safe-path.js';
import { createHandler } from './plan.js';

function applyHostHints(
  frontmatter: Record<string, unknown>,
  hostId: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const hostPrefix = `agent-add/${hostId}/`;

  for (const [key, value] of Object.entries(frontmatter)) {
    if (key.startsWith('agent-add/')) {
      if (key.startsWith(hostPrefix)) {
        const fieldName = key.slice(hostPrefix.length);
        result[fieldName] = value;
      }
      // drop all agent-add/* keys
    } else {
      result[key] = value;
    }
  }

  return result;
}

function processSubAgentContent(content: string, hostId: string): string {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!fmMatch) {
    return content;
  }

  const [, fmRaw, body] = fmMatch;
  let frontmatter: Record<string, unknown>;
  try {
    frontmatter = yaml.parse(fmRaw as string) as Record<string, unknown>;
    if (typeof frontmatter !== 'object' || frontmatter === null) {
      return content;
    }
  } catch {
    return content;
  }

  const processedFm = applyHostHints(frontmatter, hostId);
  const newFmStr = yaml.stringify(processedFm).trimEnd();
  return `---\n${newFmStr}\n---\n${body}`;
}

export const subAgentHandler = createHandler(async (job) => {
  const { host, assetName, resolvedSource } = job;
  const subAgentCapability = host.assets['subAgent'];
  const installDir = subAgentCapability.installDir as string;
  const ext = subAgentCapability.fileExtension ?? '.md';
  const targetPath = childPath(path.resolve(job.cwd ?? process.cwd(), installDir), `${assetName}${ext}`);

  const sourceContent = await fs.promises.readFile(resolvedSource.localPath, 'utf-8');
  const processedContent = processSubAgentContent(sourceContent, host.id);
  return { job, kind: 'file', targetPath, content: processedContent };
});
