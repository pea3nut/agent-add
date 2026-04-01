import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { ensureDir } from '../utils/fs.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

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

export const subAgentHandler: AssetHandler = {
  async handle(job: InstallJob): Promise<InstallResult> {
    const { host, assetName, resolvedSource } = job;
    const subAgentCapability = host.assets['subAgent'];
    const installDir = subAgentCapability.installDir as string;
    const ext = subAgentCapability.fileExtension ?? '.md';
    const targetPath = path.resolve(process.cwd(), installDir, `${assetName}${ext}`);

    let sourceContent: string;
    try {
      sourceContent = await fs.promises.readFile(resolvedSource.localPath, 'utf-8');
    } catch (err) {
      return {
        job,
        status: 'error',
        reason: `Failed to read sub-agent source: ${(err as Error).message}`,
      };
    }

    const processedContent = processSubAgentContent(sourceContent, host.id);

    await ensureDir(path.dirname(targetPath));

    let existingContent: string | null = null;
    try {
      existingContent = await fs.promises.readFile(targetPath, 'utf-8');
    } catch {
      // file doesn't exist
    }

    if (existingContent !== null) {
      if (existingContent === processedContent) {
        return { job, status: 'exists', targetPath };
      }
      return {
        job,
        status: 'conflict',
        targetPath,
        reason: `${targetPath} already exists with different content`,
      };
    }

    await fs.promises.writeFile(targetPath, processedContent, 'utf-8');
    return { job, status: 'written', targetPath };
  },
};
