import fs from 'fs';
import path from 'path';
import { ensureDir } from '../utils/fs.js';
import { assertNoSkillLinks, assertSafeSkillTree } from './skill-safety.js';

/** Stage a complete bundle and restore the previous bundle if publication fails. */
export async function publishSkill(source: string, target: string,
  copy: (source: string, target: string) => Promise<void>): Promise<boolean> {
  const canonicalSource = await fs.promises.realpath(source);
  const relative = path.relative(canonicalSource, target);
  if (relative && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative))
    throw new Error('Skill destination cannot be inside its source directory');
  const parent = path.dirname(target);
  await assertNoSkillLinks(parent);
  await ensureDir(parent);
  const stage = await fs.promises.mkdtemp(path.join(parent, '.agent-add-skill-'));
  const previous = path.join(stage, 'previous');
  let backup = false;
  let retain = false;
  try {
    const bundle = path.join(stage, 'bundle');
    await copy(source, bundle);
    await assertNoSkillLinks(target);
    let present = false;
    try { await assertSafeSkillTree(target); present = true; }
    catch (err) { if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err; }
    if (present) { await fs.promises.rename(target, previous); backup = true; }
    try { await fs.promises.rename(bundle, target); }
    catch (error) {
      if (backup) {
        try { await fs.promises.rename(previous, target); backup = false; }
        catch (rollback) {
          retain = true;
          throw new AggregateError([error, rollback], 'Skill rollback failed; original bundle retained at ' + previous);
        }
      }
      throw error;
    }
    return present;
  } finally {
    if (!retain) await fs.promises.rm(stage, { recursive: true, force: true });
  }
}
