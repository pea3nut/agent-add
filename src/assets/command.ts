import fs from 'fs';
import path from 'path';
import { ensureDir } from '../utils/fs.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

export const commandHandler: AssetHandler = {
  async handle(job: InstallJob): Promise<InstallResult> {
    const { host, assetName, resolvedSource } = job;
    const commandCapability = host.assets['command'];
    const installDir = commandCapability.installDir as string;
    const ext = commandCapability.fileExtension ?? '.md';
    const targetPath = path.resolve(process.cwd(), installDir, `${assetName}${ext}`);

    let newContent: string;
    try {
      newContent = await fs.promises.readFile(resolvedSource.localPath, 'utf-8');
    } catch (err) {
      return {
        job,
        status: 'error',
        reason: `Failed to read command source: ${(err as Error).message}`,
      };
    }

    await ensureDir(path.dirname(targetPath));

    let existingContent: string | null = null;
    try {
      existingContent = await fs.promises.readFile(targetPath, 'utf-8');
    } catch {
      // file doesn't exist
    }

    if (existingContent !== null) {
      if (existingContent === newContent) {
        return { job, status: 'exists', targetPath };
      }
      return {
        job,
        status: 'conflict',
        targetPath,
        reason: `${targetPath} already exists with different content`,
      };
    }

    await fs.promises.writeFile(targetPath, newContent, 'utf-8');
    return { job, status: 'written', targetPath };
  },
};
