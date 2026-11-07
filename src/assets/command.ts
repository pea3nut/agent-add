import fs from 'fs';
import path from 'path';
import { atomicWriteText, readTextOrNull } from '../utils/config.js';
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

    if (host.serializeCommand) {
      try {
        newContent = host.serializeCommand(newContent);
      } catch (err) {
        return {
          job,
          status: 'error',
          reason: (err as Error).message,
        };
      }
    }

    try {
      const existing = await readTextOrNull(targetPath);
      await atomicWriteText(targetPath, newContent);
      return { job, status: existing === null ? 'written' : 'overwritten', targetPath };
    } catch (err) {
      return { job, status: 'error', targetPath, reason: (err as Error).message };
    }
  },
};
