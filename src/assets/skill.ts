import fs from 'fs';
import path from 'path';
import { sameSkillBundle } from './skill-compare.js';
import { publishSkill } from './skill-publication.js';
import { assertNoSkillLinks, assertSafeSkillTree, resolveSkillDirectory } from './skill-safety.js';
import { ensureDir } from '../utils/fs.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

async function copyDirRecursive(src: string, dest: string): Promise<void> {
  await assertNoSkillLinks(dest);
  await ensureDir(dest);
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else {
      await assertNoSkillLinks(destPath);
      await fs.promises.copyFile(srcPath, destPath, fs.constants.COPYFILE_EXCL);
    }
  }
}

export const skillHandler: AssetHandler = {
  async handle(job: InstallJob): Promise<InstallResult> {
    const { host, assetName, resolvedSource } = job;
    const skillCapability = host.assets['skill'];
    const installDir = await resolveSkillDirectory(
      skillCapability.installDir as string, host.rootDir ?? process.cwd(),
    );
    const targetDir = path.resolve(installDir, assetName);
    const entryFile = path.join(targetDir, skillCapability.entryFile ?? 'SKILL.md');

    await assertNoSkillLinks(targetDir);
    await assertSafeSkillTree(resolvedSource.localPath);
    let existing = false;
    try {
      await assertSafeSkillTree(targetDir);
      existing = true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }

    let installed = false;
    try {
      await fs.promises.access(entryFile);
      installed = true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
    if (existing && (installed || (await fs.promises.readdir(targetDir)).length > 0)) {
      if (!await sameSkillBundle(resolvedSource.localPath, targetDir)) {
        return { job, status: 'skipped', targetPath: entryFile,
          reason: 'Same-name Skill has different or incomplete content; existing files were preserved' };
      }
      return { job, status: 'exists', targetPath: entryFile };
    }

    await publishSkill(resolvedSource.localPath, targetDir, copyDirRecursive);

    return { job, status: 'written', targetPath: entryFile };
  },
};
