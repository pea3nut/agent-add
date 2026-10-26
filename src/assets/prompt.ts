import fs from 'fs';
import path from 'path';
import { childPath } from '../utils/safe-path.js';
import { createHandler } from './plan.js';

export const promptHandler = createHandler(async (job) => {
  const capability = job.host.assets.prompt;
  const cwd = job.cwd ?? process.cwd();
  const content = await fs.promises.readFile(job.resolvedSource.localPath, 'utf-8');
  if (capability.writeStrategy === 'create-file-in-dir') {
    return { job, kind: 'file', content, targetPath: childPath(path.resolve(cwd, capability.installDir!), `${job.assetName}.md`) };
  }
  if (/[\r\n<>]/.test(job.assetName)) throw new Error('Invalid prompt marker name');
  return { job, kind: 'prompt', content, targetPath: path.resolve(cwd, capability.targetFile!) };
});
