import { HostId } from '../hosts/types.js';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { stringify } from 'smol-toml';
import {
  atomicWriteText,
  readTextOrNull,
} from '../utils/config.js';
import { applyHostHints, splitFrontmatter } from '../utils/frontmatter.js';
import type { AssetHandler, InstallJob, InstallResult } from './types.js';

function processSubAgentContent(content: string, job: InstallJob): string {
  const { metadata, body, hasFrontmatter } = splitFrontmatter(content);
  const processed = applyHostHints(metadata, job.host.id);
  if (job.host.id === HostId.Codex || job.host.id === HostId.Vibe) {
    if (
      typeof processed.description !== 'string' ||
      !processed.description.trim()
    )
      throw new Error('A nonempty sub-agent description is required');
    if (job.host.id === HostId.Codex) {
      const allowed = new Set([
        'name',
        'description',
        'developer_instructions',
        'model',
        'model_provider',
        'model_reasoning_effort',
        'sandbox_mode',
        'mcp_servers',
        'skills',
        'nickname_candidates',
      ]);
      for (const key of Object.keys(processed))
        if (!allowed.has(key))
          throw new Error(
            'Codex sub-agent cannot represent field ' +
              key +
              '; use host-specific hints',
          );
      const result: Record<string, unknown> = {
        ...processed,
        name: processed.name ?? path.basename(job.assetName),
        developer_instructions: processed.developer_instructions ?? body,
      };
      for (const key of [
        'name',
        'description',
        'developer_instructions',
      ] as const)
        if (typeof result[key] !== 'string' || !result[key].trim())
          throw new Error('Codex requires nonempty ' + key);
      return stringify(result);
    }
    if (path.basename(job.assetName) === 'main')
      throw new Error('Vibe reserves the agent name main');
    const { name, model, ...native } = processed;
    if (native.system_prompt_id !== undefined)
      throw new Error(
        'Use inline instructions for Vibe sub-agents; external prompt references are not installed automatically',
      );
    if (native.agent_type !== undefined && native.agent_type !== 'subagent')
      throw new Error('Vibe sub-agent must have agent_type = subagent');
    const allowed = new Set([
      'description',
      'display_name',
      'instructions',
      'agent_type',
      'active_model',
      'safety',
      'enabled_tools',
      'disabled_tools',
      'tools',
      'enabled_skills',
      'disabled_skills',
    ]);
    for (const key of Object.keys(native))
      if (!allowed.has(key))
        throw new Error(
          'Vibe sub-agent cannot represent field ' +
            key +
            '; use host-specific hints',
        );
    const result = {
      ...native,
      agent_type: 'subagent',
      display_name: native.display_name ?? name ?? path.basename(job.assetName),
      instructions: native.instructions ?? body,
    };
    if (typeof result.instructions !== 'string' || !result.instructions.trim())
      throw new Error('Vibe sub-agent instructions must be a nonempty string');
    return stringify(
      model === undefined ? result : { active_model: model, ...result },
    );
  }
  if (!hasFrontmatter) return body;
  return `---\n${yaml.stringify(processed).trimEnd()}\n---\n${body}`;
}

export const subAgentHandler: AssetHandler = {
  async handle(job: InstallJob): Promise<InstallResult> {
    const { host, assetName, resolvedSource } = job;
    const subAgentCapability = host.assets['subAgent'];
    const installDir = subAgentCapability.installDir as string;
    const ext = subAgentCapability.fileExtension ?? '.md';
    const targetPath = path.join(
      path.resolve(installDir),
      `${assetName}${ext}`,
    );

    let sourceContent: string;
    try {
      sourceContent = await fs.promises.readFile(
        resolvedSource.localPath,
        'utf-8',
      );
    } catch (err) {
      return {
        job,
        status: 'error',
        reason: `Failed to read sub-agent source: ${(err as Error).message}`,
      };
    }

    let processedContent: string;
    let existingContent: string | null;
    try {
      processedContent = processSubAgentContent(sourceContent, job);
      existingContent = await readTextOrNull(targetPath);
    } catch (err) {
      return {
        job,
        status: 'error',
        targetPath,
        reason: (err as Error).message,
      };
    }

    if (existingContent !== null) {
      if (existingContent === processedContent) {
        return { job, status: 'exists', targetPath };
      }
      return {
        job,
        status: 'conflict',
        targetPath,
        reason: `${targetPath} already exists with different content`,
      };
    }

    await atomicWriteText(targetPath, processedContent);
    return { job, status: 'written', targetPath };
  },
};
