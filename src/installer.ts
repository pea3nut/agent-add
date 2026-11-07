import fs from 'fs';
import path from 'path';
import type { AssetType, HostConfig, InstallScope } from './hosts/types.js';
import { selectHostScope } from './hosts/scope.js';
import type {
  InstallJob,
  InstallResult,
  ResolvedSource,
} from './assets/types.js';
import { resolveSource } from './source/index.js';
import { inferName } from './source/infer-name.js';
import { expandDirectory } from './source/expand-directory.js';
import { loadManifest } from './manifest/parser.js';
import { mcpHandler } from './assets/mcp.js';
import { skillHandler } from './assets/skill.js';
import { promptHandler } from './assets/prompt.js';
import { commandHandler } from './assets/command.js';
import { subAgentHandler } from './assets/sub-agent.js';
import type { InstallSummary } from './utils/summary.js';
import { unwrapMcpServers } from './utils/unwrap-mcp-servers.js';
import { convertMcpServer } from './hosts/mcp-source.js';
import { assertSafeSkillTree } from './assets/skill-safety.js';
import { formatSubAgent } from './hosts/sub-agent.js';
import { isRecord } from './utils/config.js';
import type { InstallProgress } from './utils/progress.js';

const README_URL =
  'https://github.com/pea3nut/agent-add/blob/master/src/hosts/README.md';
const PR_URL = 'https://github.com/pea3nut/agent-add/pulls';

export interface CliInput {
  mcp: string[];
  skill: string[];
  prompt: string[];
  command: string[];
  subAgent: string[];
  pack: string[];
  host?: string;
  scope?: InstallScope;
}

async function cleanupTempDirs(tempDirs: Set<string>): Promise<void> {
  for (const dir of tempDirs) {
    try {
      await fs.promises.rm(dir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

function getHandler(assetType: AssetType) {
  switch (assetType) {
    case 'mcp':
      return mcpHandler;
    case 'skill':
      return skillHandler;
    case 'prompt':
      return promptHandler;
    case 'command':
      return commandHandler;
    case 'subAgent':
      return subAgentHandler;
  }
}

async function validateAsset(
  assetType: AssetType,
  resolved: ResolvedSource,
): Promise<string | null> {
  if (assetType === 'skill') {
    if (
      resolved.type === 'http-file' ||
      resolved.type === 'inline-json' ||
      resolved.type === 'inline-md'
    ) {
      return 'Skill assets must point to a directory source (local path or Git URL); inline content and direct HTTP(S) URLs are not supported';
    }
    const skillMdPath = path.join(resolved.localPath, 'SKILL.md');
    try {
      await fs.promises.access(skillMdPath);
    } catch {
      return `Skill directory is missing a SKILL.md file (expected path: ${skillMdPath})`;
    }
    return null;
  }

  if (assetType === 'mcp') {
    try {
      await fs.promises.access(resolved.localPath);
    } catch {
      return `MCP source file does not exist: ${resolved.localPath}`;
    }
    if (!resolved.localPath.endsWith('.json')) {
      return `MCP source file extension must be .json (got: ${resolved.localPath})`;
    }
    return null;
  }

  if (
    assetType === 'prompt' ||
    assetType === 'command' ||
    assetType === 'subAgent'
  ) {
    try {
      await fs.promises.access(resolved.localPath);
    } catch {
      return `Source file does not exist: ${resolved.localPath}`;
    }
    if (!resolved.localPath.endsWith('.md')) {
      return `${assetType} source file extension must be .md (got: ${resolved.localPath})`;
    }
    return null;
  }

  return null;
}

export async function runInstaller(
  cliInput: CliInput,
  host: HostConfig,
  cwd: string,
  progress?: InstallProgress,
): Promise<InstallSummary> {
  host = selectHostScope(host, cliInput.scope ?? 'project', cwd);
  const explicit: Array<{ type: AssetType; source: string }> = [];
  for (const type of ['mcp', 'skill', 'prompt', 'command', 'subAgent'] as const)
    for (const source of cliInput[type]) explicit.push({ type, source });
  const items: Array<{ type: AssetType; source: string }> = [];
  const label = (type: AssetType | 'pack', source: string) =>
    `${type}/${inferName(source.endsWith('/*') ? source.slice(0, -2) : source, { isDirectorySource: type === 'skill' })}`;
  for (const source of cliInput.pack) {
    progress?.pending(label('pack', source));
    progress?.start(label('pack', source), 'loading manifest');
    const manifest = await loadManifest(source, cwd, progress);
    progress?.finish('ready');
    for (const asset of manifest.assets)
      for (const value of Array.isArray(asset.source) ? asset.source : [asset.source])
        items.push({ type: asset.type, source: value });
  }
  // Pack order is preserved; explicit flags override packs and repeated flags
  // overwrite in their supplied order. Every source is validated before writes.
  items.push(...explicit);
  for (const item of items) {
    if (!host.assets[item.type].supported) {
      process.stderr.write(`Error: Host "${host.id}" does not support asset type "${item.type}".\n` +
        `Reason: ${host.assets[item.type].reason ?? 'Unsupported asset'}\n` +
        `• View the full host capability matrix: ${README_URL}\n• Open a PR: ${PR_URL}\n`);
      process.exit(2);
    }
    progress?.pending(label(item.type, item.source));
  }
  const temporary = new Set<string>();
  const jobs: InstallJob[] = [];
  try {
    for (const item of items) {
      progress?.start(label(item.type, item.source));
      const glob = item.source.endsWith('/*');
      const source = glob ? item.source.slice(0, -2) : item.source;
      const resolved = await resolveSource(source, cwd, progress?.source);
      if (resolved.tempDir) temporary.add(resolved.tempDir);
      const entries = glob
        ? await expandDirectory(resolved.localPath, item.type)
        : [{ assetName: inferName(source, { isDirectorySource: item.type === 'skill' }), localPath: resolved.localPath }];
      if (!entries.length) throw new Error('No matching files found in directory for ' + item.type);
      for (const entry of entries) {
        const expanded = { ...resolved, localPath: entry.localPath };
        const validation = await validateAsset(item.type, expanded);
        if (validation) {
          process.stderr.write(`agent-add error: ${validation}\n  Source: ${source}\n`);
          await cleanupTempDirs(temporary);
          process.exit(2);
        }
        jobs.push({ host, assetType: item.type,
          assetName: glob ? path.basename(resolved.localPath) + '/' + entry.assetName : entry.assetName,
          resolvedSource: expanded });
      }
      progress?.finish('ready');
    }
    progress?.start('batch', 'validating');
    const invalid = new Map<InstallJob, string>();
    for (const job of jobs) {
      try {
        if (job.assetType === 'skill') {
          await assertSafeSkillTree(job.resolvedSource.localPath);
          continue;
        }
        const content = await fs.promises.readFile(job.resolvedSource.localPath, 'utf-8');
        if (job.assetType === 'mcp') {
          const parsed: unknown = JSON.parse(content);
          if (!isRecord(parsed)) throw new Error('MCP source must be a JSON object');
          const wrapped = unwrapMcpServers(parsed);
          if (wrapped) job.assetName = wrapped.name;
          convertMcpServer(host, wrapped?.config ?? parsed, job.assetName);
        } else if (job.assetType === 'command') {
          host.serializeCommand?.(content);
        } else if (job.assetType === 'subAgent') {
          formatSubAgent(host, content, job.assetName);
        }
      } catch (err) { invalid.set(job, (err as Error).message); }
    }
    if (invalid.size) {
      progress?.finish('error');
      return { host, results: jobs.map((job) => ({ job, status: 'error',
        reason: invalid.get(job) ?? 'Batch blocked by invalid source; nothing was written' })) };
    }
    progress?.stop();
    const results: InstallResult[] = [];
    for (const job of jobs) {
      progress?.start(`${job.assetType}/${job.assetName}`, 'installing');
      try {
        results.push(await getHandler(job.assetType).handle(job));
      } catch (err) {
        results.push({ job, status: 'error', reason: (err as Error).message });
      }
      progress?.finish(results[results.length - 1]!.status);
    }
    return { host, results };
  } finally { await cleanupTempDirs(temporary); }
}
