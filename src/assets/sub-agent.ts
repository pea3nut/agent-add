import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import {
  atomicWriteText,
  readTextOrNull,
} from '../utils/config.js';
import { applyHostHints, splitFrontmatter } from '../utils/frontmatter.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

function processSubAgentContent(content: string, job: InstallJob): string {
  const { metadata, body, hasFrontmatter } = splitFrontmatter(content);
  const processed = applyHostHints(metadata, job.host.id);
  if (job.host.serializeSubAgent)
    return job.host.serializeSubAgent({ metadata: processed, body }, job.assetName);
  if (!hasFrontmatter) return body;
  return `---\n${yaml.stringify(processed).trimEnd()}\n---\n${body}`;
}

export const subAgentHandler: AssetHandler = {
  async handle(job: InstallJob): Promise<InstallResult> {
    const { host, assetName, resolvedSource } = job;
    const subAgentCapability = host.assets['subAgent'];
    const installDir = subAgentCapability.installDir as string;
    const ext = subAgentCapability.fileExtension ?? '.md';
    const targetPath = path.join(
      path.resolve(installDir),
      `${assetName}${ext}`,
    );

    let sourceContent: string;
    try {
      sourceContent = await fs.promises.readFile(
        resolvedSource.localPath,
        'utf-8',
      );
    } catch (err) {
      return {
        job,
        status: 'error',
        reason: `Failed to read sub-agent source: ${(err as Error).message}`,
      };
    }

    let processedContent: string;
    let existingContent: string | null;
    try {
      processedContent = processSubAgentContent(sourceContent, job);
      existingContent = await readTextOrNull(targetPath);
    } catch (err) {
      return {
        job,
        status: 'error',
        targetPath,
        reason: (err as Error).message,
      };
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

    await atomicWriteText(targetPath, processedContent);
    return { job, status: 'written', targetPath };
  },
};
