import fs from 'fs';
import path from 'path';
import { ensureDir } from '../utils/fs.js';
import { assertNoSkillLinks } from './skill-safety.js';

/** Publish only a complete bundle; failed copies never leave a visible entry file. */
export async function publishSkill(
  source: string,
  target: string,
  copy: (source: string, target: string) => Promise<void>,
): Promise<void> {
  const parent = path.dirname(target);
  await assertNoSkillLinks(parent);
  await ensureDir(parent);
  const stage = await fs.promises.mkdtemp(path.join(parent, '.agent-add-skill-'));
  try {
    const bundle = path.join(stage, 'bundle');
    await copy(source, bundle);
    await assertNoSkillLinks(target);
    // Only an empty legacy target can be removed. Never discard user files.
    try {
      await fs.promises.rmdir(target);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
    await fs.promises.rename(bundle, target);
  } finally {
    await fs.promises.rm(stage, { recursive: true, force: true });
  }
}
