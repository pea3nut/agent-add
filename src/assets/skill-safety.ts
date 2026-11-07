import fs from 'fs';
import path from 'path';
import os from 'os';

/** Never follow links in a Skill destination, including directory ancestors. */
export async function assertNoSkillLinks(target: string): Promise<void> {
  const absolute = path.resolve(target);
  const parent = path.dirname(absolute);
  if (parent !== absolute) await assertNoSkillLinks(parent);
  let stat;
  try {
    stat = await fs.promises.lstat(absolute);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw err;
  }
  if (stat.isSymbolicLink()) throw new Error('Skill destination must not contain symbolic links: ' + absolute);
}

export async function assertSafeSkillTree(root: string): Promise<void> {
  const stat = await fs.promises.lstat(root);
  if (stat.isSymbolicLink()) throw new Error('Skill bundle must not contain symbolic links: ' + root);
  if (!stat.isDirectory() && !stat.isFile()) throw new Error('Skill bundle contains a non-regular entry: ' + root);
  if (!stat.isDirectory()) return;
  for (const entry of await fs.promises.readdir(root)) {
    await assertSafeSkillTree(path.join(root, entry));
  }
}

/** Resolve trusted project/home/temp aliases before guarding host-owned paths. */
export async function resolveSkillDirectory(directory: string, projectRoot: string): Promise<string> {
  const absolute = path.resolve(directory);
  const anchors = [projectRoot, os.homedir(), os.tmpdir()]
    .map((root) => path.resolve(root)).sort((a, b) => b.length - a.length);
  for (const root of anchors) {
    const relative = path.relative(root, absolute);
    if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) continue;
    let existing = root;
    const missing: string[] = [];
    while (true) {
      try {
        const canonical = await fs.promises.realpath(existing);
        return path.resolve(canonical, ...missing.reverse(), relative);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
        missing.push(path.basename(existing));
        const parent = path.dirname(existing);
        if (parent === existing) throw err;
        existing = parent;
      }
    }
  }
  return absolute;
}
