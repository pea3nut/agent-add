import fs from 'fs';
import path from 'path';
import type { AssetType } from '../hosts/types.js';

function getExtension(assetType: AssetType): string {
  if (assetType === 'mcp') return '.json';
  return '.md';
}

export async function expandDirectory(
  localPath: string,
  assetType: AssetType,
): Promise<Array<{ assetName: string; localPath: string }>> {
  const entries = await fs.promises.readdir(localPath, { withFileTypes: true });

  if (assetType === 'skill') {
    const results: Array<{ assetName: string; localPath: string }> = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillMd = path.join(localPath, entry.name, 'SKILL.md');
      try {
        await fs.promises.access(skillMd);
        results.push({ assetName: entry.name, localPath: path.join(localPath, entry.name) });
      } catch {
        // not a skill directory, skip
      }
    }
    return results;
  }

  const ext = getExtension(assetType);
  const results: Array<{ assetName: string; localPath: string }> = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(ext)) continue;
    const dotIdx = entry.name.lastIndexOf('.');
    const assetName = dotIdx > 0 ? entry.name.slice(0, dotIdx) : entry.name;
    results.push({ assetName, localPath: path.join(localPath, entry.name) });
  }

  return results;
}
