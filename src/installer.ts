import fs from 'fs';
import path from 'path';
import type { AssetType, HostConfig } from './hosts/types.js';
import type { InstallJob, InstallResult, PreparedAsset, ResolvedSource } from './assets/types.js';
import { resolveSource } from './source/index.js';
import { inferName } from './source/infer-name.js';
import { expandDirectory } from './source/expand-directory.js';
import { loadManifest } from './manifest/parser.js';
import { mcpHandler } from './assets/mcp.js';
import { skillHandler } from './assets/skill.js';
import { promptHandler } from './assets/prompt.js';
import { commandHandler } from './assets/command.js';
import { subAgentHandler } from './assets/sub-agent.js';
import { assetError, installPrepared } from './assets/plan.js';
import { describeSource } from './utils/redact.js';
import type { InstallSummary } from './utils/summary.js';

export interface OrderedInput {
  type: AssetType | 'pack';
  source: string;
}

export interface CliInput {
  mcp: string[];
  skill: string[];
  prompt: string[];
  command: string[];
  subAgent: string[];
  pack: string[];
  host?: string;
  overwrite?: boolean;
  inputs?: OrderedInput[];
}

async function cleanupTempDirs(tempDirs: Set<string>): Promise<void> {
  for (const dir of tempDirs) {
    try {
      await fs.promises.rm(dir, { recursive: true, force: true });
    } catch {
      // Cleanup must not mask the original failure.
    }
  }
}

function getHandler(assetType: AssetType) {
  switch (assetType) {
    case 'mcp': return mcpHandler;
    case 'skill': return skillHandler;
    case 'prompt': return promptHandler;
    case 'command': return commandHandler;
    case 'subAgent': return subAgentHandler;
  }
}

async function validateAsset(assetType: AssetType, resolved: ResolvedSource): Promise<string | null> {
  if (assetType === 'skill') {
    if (resolved.type === 'http-file' || resolved.type === 'inline-json' || resolved.type === 'inline-md') {
      return 'Skill assets must point to a directory source (local path or Git URL); inline content and direct HTTP(S) URLs are not supported';
    }
    try {
      await fs.promises.access(path.join(resolved.localPath, 'SKILL.md'));
    } catch {
      return `Skill directory is missing a SKILL.md file (expected path: ${path.join(resolved.localPath, 'SKILL.md')})`;
    }
    return null;
  }
  try {
    await fs.promises.access(resolved.localPath);
  } catch {
    return `Source file does not exist: ${resolved.localPath}`;
  }
  const ext = assetType === 'mcp' ? '.json' : '.md';
  if (!resolved.localPath.endsWith(ext)) return `${assetType} source file extension must be ${ext} (got: ${resolved.localPath})`;
  return null;
}

function orderedInputs(input: CliInput): OrderedInput[] {
  if (input.inputs) return input.inputs;
  const types = ['mcp', 'skill', 'prompt', 'command', 'subAgent', 'pack'] as const;
  return types.flatMap((type) => input[type].map((source) => ({ type, source })));
}

export async function runInstaller(cliInput: CliInput, host: HostConfig, cwd: string): Promise<InstallSummary> {
  const inputs = orderedInputs(cliInput);
  for (const item of inputs) {
    if (item.type !== 'pack' && !host.assets[item.type].supported) {
      process.stderr.write(
        `Error: Host "${host.id}" does not support asset type "${item.type}".\n\n` +
        `Reason: ${host.assets[item.type].reason ?? 'This asset type is not supported by this host.'}\n\n` +
        'View the full host capability matrix: https://github.com/pea3nut/agent-add/blob/master/src/hosts/README.md\n',
      );
      process.exit(2);
    }
  }

  const items: Array<{ type: AssetType; source: string }> = [];
  for (const input of inputs) {
    if (input.type === 'pack') {
      const manifest = await loadManifest(input.source, cwd);
      for (const asset of manifest.assets) {
        const sources = Array.isArray(asset.source) ? asset.source : [asset.source];
        for (const source of sources) items.push({ type: asset.type, source });
      }
    } else {
      items.push({ type: input.type, source: input.source });
    }
  }

  const tempDirs = new Set<string>();
  const prepared: PreparedAsset[] = [];
  const errors: InstallResult[] = [];
  const skipped: InstallResult[] = [];
  try {
    for (const item of items) {
      if (!host.assets[item.type].supported) {
        skipped.push({
          job: { assetType: item.type, assetName: item.type, host, cwd,
            resolvedSource: { type: 'local', localPath: '', originalSource: item.source } },
          status: 'skipped', reason: host.assets[item.type].reason ?? `${host.displayName} does not support ${item.type}`,
        });
        continue;
      }
      const glob = item.source.endsWith('/*');
      const cleanSource = glob ? item.source.slice(0, -2) : item.source;
      const resolved = await resolveSource(cleanSource, cwd);
      if (resolved.tempDir) tempDirs.add(resolved.tempDir);
      const entries = glob
        ? (await expandDirectory(resolved.localPath, item.type)).map((entry) => ({
          assetName: `${path.basename(resolved.localPath)}/${entry.assetName}`, localPath: entry.localPath,
        }))
        : [{ assetName: inferName(cleanSource, { isDirectorySource: item.type === 'skill' }), localPath: resolved.localPath }];
      if (entries.length === 0) {
        process.stderr.write(`agent-add error: No matching files found in directory for ${item.type}\n  Source: ${describeSource(item.source)}\n`);
        await cleanupTempDirs(tempDirs);
        process.exit(2);
      }
      for (const entry of entries) {
        const source = { ...resolved, localPath: entry.localPath, originalSource: item.source };
        const validationError = await validateAsset(item.type, source);
        if (validationError) {
          process.stderr.write(`agent-add error: ${validationError}\n  Source: ${describeSource(item.source)}\n`);
          await cleanupTempDirs(tempDirs);
          process.exit(2);
        }
        const job: InstallJob = { assetType: item.type, assetName: entry.assetName, host, cwd, resolvedSource: source };
        try {
          prepared.push(await getHandler(item.type).prepare(job));
        } catch (err) {
          errors.push(assetError(job, err));
        }
      }
    }
    return { host, results: [...skipped, ...await installPrepared(prepared, cliInput.overwrite ?? false, errors)] };
  } finally {
    await cleanupTempDirs(tempDirs);
  }
}
