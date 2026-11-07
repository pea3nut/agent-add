import fs from 'fs';
import path from 'path';
import {
  atomicWriteText,
  readTextOrNull,
} from '../utils/config.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

export function mergePrompt(
  existing: string,
  content: string,
  name: string,
): { content: string; status: 'overwritten' | 'written' } {
  if (/\r|\n|-->/.test(name))
    throw new Error('Prompt name cannot be represented in an HTML marker');
  const open = '<!-- agent-add:' + name + ' -->';
  const close = '<!-- /agent-add:' + name + ' -->';
  if (content.includes(open) || content.includes(close))
    throw new Error('Prompt source contains its own reserved marker');
  const block = open + '\n' + content + '\n' + close;
  const opens = existing.split(open).length - 1;
  const closes = existing.split(close).length - 1;
  if (opens || closes) {
    const start = existing.indexOf(open);
    const end = existing.indexOf(close);
    const onLine = (index: number, marker: string) =>
      (index === 0 || existing[index - 1] === '\n') &&
      /^(?:\r?\n|$)/.test(existing.slice(index + marker.length));
    if (
      opens !== 1 ||
      closes !== 1 ||
      end < start ||
      !onLine(start, open) ||
      !onLine(end, close)
    )
      throw new Error(
        'Malformed or duplicate prompt markers; existing file was not modified',
      );
    return {
      content:
        existing.slice(0, start) + block + existing.slice(end + close.length),
      status: 'overwritten',
    };
  }
  const separator =
    existing && !existing.endsWith('\n') ? '\n\n' : existing ? '\n' : '';
  return { content: existing + separator + block + '\n', status: 'written' };
}

export const promptHandler: AssetHandler = {
  async handle(job: InstallJob): Promise<InstallResult> {
    const capability = job.host.assets.prompt;
    let targetPath: string | undefined;
    try {
      targetPath =
        capability.writeStrategy === 'create-file-in-dir'
          ? path.join(
              path.resolve(capability.installDir!),
              job.assetName + '.md',
            )
          : job.host.resolvePromptTarget
            ? await job.host.resolvePromptTarget(job.host)
            : path.resolve(capability.targetFile!);
      const content = await fs.promises.readFile(
        job.resolvedSource.localPath,
        'utf-8',
      );
      const existing = await readTextOrNull(targetPath);
      const merged =
        capability.writeStrategy === 'create-file-in-dir'
          ? {
              content,
              status: existing === null ? ('written' as const) : ('overwritten' as const),
            }
          : mergePrompt(existing ?? '', content, job.assetName);
      const registration = await job.host.registerPrompt?.(job.host, targetPath);
      await atomicWriteText(targetPath, merged.content);
      if (registration)
        await atomicWriteText(registration.file, registration.content);
      return {
        job,
        status: merged.status,
        targetPath,
      };
    } catch (err) {
      return {
        job,
        status: 'error',
        targetPath,
        reason: (err as Error).message,
      };
    }
  },
};
