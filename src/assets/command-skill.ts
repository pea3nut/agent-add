import fs from 'fs';
import os from 'os';
import path from 'path';
import type { InstallJob } from './types.js';

/** Prepare an adapter-generated bundle for the existing Skill installation path. */
export async function stageCommandSkill(job: InstallJob, temporary: Set<string>): Promise<InstallJob> {
  const convert = job.host.commandToSkill;
  if (!convert) return job;
  if (!job.host.assets.skill.supported)
    throw new Error('Command-to-Skill conversion requires a supported Skill destination');
  const content = await fs.promises.readFile(job.resolvedSource.localPath, 'utf8');
  const { files, invocation } = convert(content, job.assetName);
  if (!files['SKILL.md']?.trim()) throw new Error('Converted command is missing SKILL.md');
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-command-skill-'));
  temporary.add(directory);
  for (const [relative, text] of Object.entries(files)) {
    const target = path.resolve(directory, relative);
    const within = path.relative(directory, target);
    if (!within || within === '..' || within.startsWith('..' + path.sep) || path.isAbsolute(within))
      throw new Error('Converted command file must stay within its Skill bundle');
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.writeFile(target, text, 'utf8');
  }
  return {
    ...job,
    assetType: 'skill',
    conversion: { from: job.assetType, invocation },
    resolvedSource: { ...job.resolvedSource, type: 'local', localPath: directory, tempDir: directory },
  };
}
