import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { stringify } from 'smol-toml';
import { childPath } from '../utils/safe-path.js';
import { createHandler } from './plan.js';

function toToml(content: string): string {
  const match = content.match(/^\uFEFF?---[\t ]*\r?\n([\s\S]*?\r?\n)?---[\t ]*(?:\r?\n|$)([\s\S]*)$/);
  let prompt = content;
  let description: string | undefined;

  if (match) {
    const metadata: unknown = yaml.parse(match[1] ?? '');
    if (metadata !== null && (typeof metadata !== 'object' || Array.isArray(metadata))) {
      throw new Error('Command frontmatter must be a YAML mapping');
    }
    const value = (metadata as Record<string, unknown> | null)?.description;
    if (value !== undefined && typeof value !== 'string') {
      throw new Error('Command description must be a string');
    }
    description = value;
    prompt = match[2]!;
  }

  return stringify(description === undefined ? { prompt } : { description, prompt });
}

export const commandHandler = createHandler(async (job) => {
  const capability = job.host.assets.command;
  const root = path.resolve(job.cwd ?? process.cwd(), capability.installDir!);
  const ext = capability.fileExtension ?? '.md';
  let content = await fs.promises.readFile(job.resolvedSource.localPath, 'utf-8');
  if (ext === '.toml') {
    try {
      content = toToml(content);
    } catch (err) {
      throw new Error(`Failed to convert command source to TOML: ${(err as Error).message}`);
    }
  }
  return {
    job, kind: 'file',
    targetPath: childPath(root, `${job.assetName}${ext}`),
    content,
  };
});
