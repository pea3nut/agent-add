import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import {
  atomicWriteText,
  isRecord,
  parseConfig,
  readTextOrNull,
  resolveConfigPath,
  setConfigValue,
} from '../utils/config.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

export function mergePrompt(
  existing: string,
  content: string,
  name: string,
): { content: string; status: 'exists' | 'updated' | 'written' } {
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
    if (existing.slice(start, end + close.length) === block)
      return { content: existing, status: 'exists' };
    return {
      content:
        existing.slice(0, start) + block + existing.slice(end + close.length),
      status: 'updated',
    };
  }
  const separator =
    existing && !existing.endsWith('\n') ? '\n\n' : existing ? '\n' : '';
  return { content: existing + separator + block + '\n', status: 'written' };
}

async function prepareRegistration(
  job: InstallJob,
  target: string,
): Promise<{ file: string; content: string } | null> {
  const capability = job.host.assets.prompt;
  if (!capability.registration) return null;
  const configCapability =
    capability.registration === 'instructions'
      ? job.host.assets.mcp
      : capability;
  const file = await resolveConfigPath(configCapability);
  const existing = (await readTextOrNull(file)) ?? '{}\n';
  const document = capability.registration === 'read' ? yaml.parseDocument(existing) : null;
  if (document?.errors.length) throw new Error(document.errors[0]!.message);
  const config: unknown = document
    ? document.contents === null ? {} : document.toJS()
    : parseConfig(existing, 'jsonc');
  if (!isRecord(config)) throw new Error('Configuration must be an object');
  const key = capability.registration;
  const value = config[key];
  const items =
    key === 'read' && typeof value === 'string' ? [value] : (value ?? []);
  if (!Array.isArray(items) || items.some((v) => typeof v !== 'string'))
    throw new Error("Configuration '" + key + "' must contain file paths");
  const root = job.host.rootDir ?? process.cwd();
  const relative = path
    .relative(root, target)
    .split(path.sep)
    .join('/');
  if (items.some((v) => path.resolve(root, v) === target))
    return null;
  if (document) {
    const current = document.get(key, true);
    if (yaml.isSeq(current)) current.add(relative);
    else {
      const sequence = document.createNode([...items, relative]);
      if (yaml.isScalar(current) && typeof current.value === 'string') sequence.items[0] = current;
      document.set(key, sequence);
    }
    return { file, content: document.toString() };
  }
  return { file, content: setConfigValue(existing, [key], [...items, relative], 'jsonc') };
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
              status:
                existing === null
                  ? ('written' as const)
                  : existing === content
                    ? ('exists' as const)
                    : ('conflict' as const),
            }
          : mergePrompt(existing ?? '', content, job.assetName);
      if (merged.status === 'conflict')
        return {
          job,
          status: 'conflict',
          targetPath,
          reason: targetPath + ' already exists with different content',
        };
      const registration = await prepareRegistration(job, targetPath);
      if (merged.status !== 'exists')
        await atomicWriteText(targetPath, merged.content);
      if (registration)
        await atomicWriteText(registration.file, registration.content);
      return {
        job,
        status:
          merged.status === 'exists' && registration
            ? 'updated'
            : merged.status,
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
