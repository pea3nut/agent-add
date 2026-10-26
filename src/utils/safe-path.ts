import fs from 'fs';
import path from 'path';

export function childPath(root: string, name: string): string {
  const target = path.resolve(root, name);
  if (!isWithin(root, target) || path.relative(root, target) === '' || name.includes('\0')) {
    throw new Error('Asset name must resolve inside its install directory');
  }
  if (process.platform === 'win32' && /[:*?"<>|]/.test(name)) throw new Error('Invalid Windows asset path');
  return target;
}

export function isWithin(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export async function assertNoSymlinks(target: string): Promise<void> {
  const parent = path.dirname(target);
  if (parent !== target) await assertNoSymlinks(parent);
  try {
    const stat = await fs.promises.lstat(target);
    if (stat.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${target}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}

export async function readTree(root: string, modes = new Map<string, number>()): Promise<Map<string, Buffer | null>> {
  await assertNoSymlinks(root);
  const files = new Map<string, Buffer | null>();
  async function visit(dir: string): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relative = path.relative(root, fullPath);
      if (entry.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${fullPath}`);
      modes.set(relative, (await fs.promises.lstat(fullPath)).mode & 0o777);
      if (entry.isDirectory()) {
        files.set(relative, null);
        await visit(fullPath);
      } else if (entry.isFile()) {
        files.set(relative, await fs.promises.readFile(fullPath));
      } else {
        throw new Error(`Unsupported filesystem entry: ${fullPath}`);
      }
    }
  }
  await visit(root);
  return files;
}

export function equalTrees(a: Map<string, Buffer | null>, b: Map<string, Buffer | null>): boolean {
  return a.size === b.size && [...a].every(([name, content]) => {
    const other = b.get(name);
    return content === null ? other === null : Buffer.isBuffer(other) && content.equals(other);
  });
}
