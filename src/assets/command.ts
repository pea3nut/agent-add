import fs from 'fs';
import path from 'path';
import { childPath } from '../utils/safe-path.js';
import { createHandler } from './plan.js';

export const commandHandler = createHandler(async (job) => {
  const capability = job.host.assets.command;
  const root = path.resolve(job.cwd ?? process.cwd(), capability.installDir!);
  return {
    job, kind: 'file',
    targetPath: childPath(root, `${job.assetName}${capability.fileExtension ?? '.md'}`),
    content: await fs.promises.readFile(job.resolvedSource.localPath, 'utf-8'),
  };
});
