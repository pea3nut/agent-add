import path from 'path';
import type { InstallJob } from '../assets/types.js';
import {
  getHome,
  isRecord,
  parseConfig,
  readTextOrNull,
  resolveConfigPath,
  resolveHostPath,
} from './config.js';

export async function openclawWorkspace(job: InstallJob): Promise<string> {
  const configFile = await resolveConfigPath(job.host.assets.mcp);
  const content = await readTextOrNull(configFile);
  const config = content === null ? {} : parseConfig(content, 'json5');
  const agents = config.agents;
  if (agents !== undefined && !isRecord(agents))
    throw new Error('OpenClaw agents must be an object');
  const defaults =
    isRecord(agents) && isRecord(agents.defaults) ? agents.defaults : {};
  const list =
    isRecord(agents) && Array.isArray(agents.list) ? agents.list : [];
  const selected =
    list.find((agent) => isRecord(agent) && agent.default === true) ?? list[0];
  const workspace =
    isRecord(selected) && selected.workspace !== undefined
      ? selected.workspace
      : defaults.workspace;
  if (
    workspace !== undefined &&
    (typeof workspace !== 'string' || !workspace.trim())
  )
    throw new Error('OpenClaw workspace must be a nonempty path');
  return resolveHostPath(
    (workspace as string) ?? path.join(getHome(), '.openclaw', 'workspace'),
  );
}

export async function promptTarget(job: InstallJob): Promise<string> {
  if (job.host.id === 'openclaw')
    return path.join(await openclawWorkspace(job), 'AGENTS.md');
  if (job.host.id === 'zed') {
    const candidates = [
      '.rules',
      '.cursorrules',
      '.windsurfrules',
      '.clinerules',
      '.github/copilot-instructions.md',
      'AGENT.md',
      'AGENTS.md',
      'CLAUDE.md',
      'GEMINI.md',
    ];
    for (const candidate of candidates)
      if ((await readTextOrNull(resolveHostPath(candidate))) !== null)
        return resolveHostPath(candidate);
  }
  if (job.host.id === 'goose' && process.env.CONTEXT_FILE_NAMES !== undefined) {
    const names: unknown = JSON.parse(process.env.CONTEXT_FILE_NAMES);
    if (
      !Array.isArray(names) ||
      !names.length ||
      names.some((v) => typeof v !== 'string' || !v.trim())
    )
      throw new Error(
        'CONTEXT_FILE_NAMES must be a nonempty JSON string array',
      );
    return resolveHostPath(names[0] as string);
  }
  if (job.host.id === 'gemini') {
    const content = await readTextOrNull(
      resolveHostPath('.gemini/settings.json'),
    );
    const config = content === null ? {} : parseConfig(content, 'jsonc');
    const context = config.context;
    const name = isRecord(context) ? context.fileName : undefined;
    if (name !== undefined) {
      const names = Array.isArray(name) ? name : [name];
      if (
        !names.length ||
        names.some((v) => typeof v !== 'string' || !v.trim())
      )
        throw new Error(
          'Gemini context.fileName must be a nonempty filename or filename array',
        );
      return resolveHostPath(names[0] as string);
    }
  }
  return resolveHostPath(job.host.assets.prompt.targetFile!);
}
