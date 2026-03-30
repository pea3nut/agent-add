import fs from 'fs';
import path from 'path';
import { ensureDir } from '../utils/fs.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

export const promptHandler: AssetHandler = {
  async handle(job: InstallJob): Promise<InstallResult> {
    const { host, assetName, resolvedSource } = job;
    const promptCapability = host.assets['prompt'];

    if (promptCapability.writeStrategy === 'create-file-in-dir') {
      const installDir = promptCapability.installDir as string;
      const dir = path.resolve(process.cwd(), installDir);
      const targetPath = path.join(dir, `${assetName}.md`);

      let newContent: string;
      try {
        newContent = await fs.promises.readFile(resolvedSource.localPath, 'utf-8');
      } catch (err) {
        return {
          job,
          status: 'error',
          reason: `Failed to read prompt source: ${(err as Error).message}`,
        };
      }

      await ensureDir(dir);

      let exists = false;
      try {
        await fs.promises.access(targetPath);
        exists = true;
      } catch {
        // file doesn't exist
      }

      if (exists) {
        return { job, status: 'exists', targetPath };
      }

      await fs.promises.writeFile(targetPath, newContent, 'utf-8');
      return { job, status: 'written', targetPath };
    }

    // Default strategy: append-with-marker
    const targetFile = promptCapability.targetFile as string;
    const targetPath = path.resolve(process.cwd(), targetFile);

    const markerOpen = `<!-- agent-get:${assetName} -->`;
    const markerClose = `<!-- /agent-get:${assetName} -->`;

    let newContent: string;
    try {
      newContent = await fs.promises.readFile(resolvedSource.localPath, 'utf-8');
    } catch (err) {
      return {
        job,
        status: 'error',
        reason: `Failed to read prompt source: ${(err as Error).message}`,
      };
    }

    await ensureDir(path.dirname(targetPath));

    let existingContent = '';
    try {
      existingContent = await fs.promises.readFile(targetPath, 'utf-8');
    } catch {
      // file doesn't exist yet
    }

    const markerBlock = `${markerOpen}\n${newContent}\n${markerClose}`;

    if (existingContent.includes(markerOpen)) {
      const startIdx = existingContent.indexOf(markerOpen);
      const endIdx = existingContent.indexOf(markerClose);
      if (endIdx !== -1) {
        const existingBlock = existingContent.slice(startIdx, endIdx + markerClose.length);
        if (existingBlock === markerBlock) {
          return { job, status: 'exists', targetPath };
        }
        const updatedContent =
          existingContent.slice(0, startIdx) +
          markerBlock +
          existingContent.slice(endIdx + markerClose.length);
        await fs.promises.writeFile(targetPath, updatedContent, 'utf-8');
        return { job, status: 'updated', targetPath };
      }
    }

    const separator = existingContent && !existingContent.endsWith('\n') ? '\n\n' : existingContent ? '\n' : '';
    await fs.promises.writeFile(targetPath, existingContent + separator + markerBlock + '\n', 'utf-8');

    return { job, status: 'written', targetPath };
  },
};
