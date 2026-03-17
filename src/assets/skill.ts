import fs from 'fs';
import path from 'path';
import { ensureDir } from '../utils/fs.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

async function copyDirRecursive(src: string, dest: string): Promise<void> {
  await ensureDir(dest);
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

export const skillHandler: AssetHandler = {
  async handle(job: InstallJob): Promise<InstallResult> {
    const { host, assetName, resolvedSource } = job;
    const skillCapability = host.assets['skill'];
    const installDir = skillCapability.installDir as string;
    const targetDir = path.resolve(process.cwd(), installDir, assetName);
    const entryFile = path.join(targetDir, 'SKILL.md');

    try {
      await fs.promises.access(targetDir);
      return { job, status: 'exists', targetPath: entryFile };
    } catch {
      // target doesn't exist, proceed with install
    }

    await copyDirRecursive(resolvedSource.localPath, targetDir);

    return { job, status: 'written', targetPath: entryFile };
  },
};
