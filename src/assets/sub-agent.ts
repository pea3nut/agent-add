import fs from 'fs';
import path from 'path';
import {
  atomicWriteText,
  readTextOrNull,
} from '../utils/config.js';
import { formatSubAgent } from '../hosts/sub-agent.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

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
      processedContent = formatSubAgent(host, sourceContent, assetName);
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
