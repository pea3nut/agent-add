import path from 'path';
import { childPath, readTree } from '../utils/safe-path.js';
import { createHandler } from './plan.js';

export const skillHandler = createHandler(async (job) => {
  const root = path.resolve(job.cwd ?? process.cwd(), job.host.assets.skill.installDir!);
  const modes = new Map<string, number>();
  const files = await readTree(job.resolvedSource.localPath, modes);
  if (!Buffer.isBuffer(files.get('SKILL.md'))) throw new Error('Skill directory is missing a SKILL.md file');
  return { job, kind: 'skill', targetPath: childPath(root, job.assetName), files, modes };
});
