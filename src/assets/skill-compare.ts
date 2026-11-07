import fs from 'fs';
import path from 'path';

/** Compare the complete bundle, including supporting files and empty directories. */
export async function sameSkillBundle(source: string, target: string): Promise<boolean> {
  const sourceEntries = await fs.promises.readdir(source, { withFileTypes: true });
  const targetEntries = await fs.promises.readdir(target, { withFileTypes: true });
  if (sourceEntries.length !== targetEntries.length) return false;
  const targets = new Map(targetEntries.map((entry) => [entry.name, entry]));
  for (const entry of sourceEntries) {
    const other = targets.get(entry.name);
    if (!other || entry.isDirectory() !== other.isDirectory() || entry.isFile() !== other.isFile()) return false;
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      if (!await sameSkillBundle(from, to)) return false;
    } else {
      const [a, z] = await Promise.all([fs.promises.readFile(from), fs.promises.readFile(to)]);
      if (!a.equals(z)) return false;
    }
  }
  return true;
}
