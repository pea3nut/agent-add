import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { stringify } from 'smol-toml';
import { ensureDir } from '../utils/fs.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

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

export const commandHandler: AssetHandler = {
  async handle(job: InstallJob): Promise<InstallResult> {
    const { host, assetName, resolvedSource } = job;
    const commandCapability = host.assets['command'];
    const installDir = commandCapability.installDir as string;
    const ext = commandCapability.fileExtension ?? '.md';
    const targetPath = path.resolve(process.cwd(), installDir, `${assetName}${ext}`);

    let newContent: string;
    try {
      newContent = await fs.promises.readFile(resolvedSource.localPath, 'utf-8');
    } catch (err) {
      return {
        job,
        status: 'error',
        reason: `Failed to read command source: ${(err as Error).message}`,
      };
    }

    if (ext === '.toml') {
      try {
        newContent = toToml(newContent);
      } catch (err) {
        return {
          job,
          status: 'error',
          reason: `Failed to convert command source to TOML: ${(err as Error).message}`,
        };
      }
    }

    await ensureDir(path.dirname(targetPath));

    let existingContent: string | null = null;
    try {
      existingContent = await fs.promises.readFile(targetPath, 'utf-8');
    } catch {
      // file doesn't exist
    }

    if (existingContent !== null) {
      if (existingContent === newContent) {
        return { job, status: 'exists', targetPath };
      }
      return {
        job,
        status: 'conflict',
        targetPath,
        reason: `${targetPath} already exists with different content`,
      };
    }

    await fs.promises.writeFile(targetPath, newContent, 'utf-8');
    return { job, status: 'written', targetPath };
  },
};
