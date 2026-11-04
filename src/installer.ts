import fs from 'fs';
import path from 'path';
import type { AssetType, HostConfig, InstallScope } from './hosts/types.js';
import { selectHostScope } from './hosts/scope.js';
import type { AssetDescriptor } from './manifest/schema.js';
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
import { deepEqualIgnoringKeyOrder } from './utils/deep-equal.js';
import { isRecord } from './utils/config.js';

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
): Promise<InstallSummary> {
  host = selectHostScope(host, cliInput.scope ?? 'project', cwd);
  const explicitDescriptors: Array<{ type: AssetType; source: string }> = [];
  const packDescriptors: AssetDescriptor[] = [];

  for (const source of cliInput.mcp) {
    explicitDescriptors.push({ type: 'mcp', source });
  }
  for (const source of cliInput.skill) {
    explicitDescriptors.push({ type: 'skill', source });
  }
  for (const source of cliInput.prompt) {
    explicitDescriptors.push({ type: 'prompt', source });
  }
  for (const source of cliInput.command) {
    explicitDescriptors.push({ type: 'command', source });
  }
  for (const source of cliInput.subAgent) {
    explicitDescriptors.push({ type: 'subAgent', source });
  }

  for (const packSource of cliInput.pack) {
    const manifest = await loadManifest(packSource, cwd);
    for (const asset of manifest.assets) {
      packDescriptors.push(asset);
    }
  }

  // Check explicit flags against host capabilities before doing any work
  for (const item of explicitDescriptors) {
    const capability = host.assets[item.type];
    if (!capability.supported) {
      const reason =
        capability.reason ?? 'This asset type is not supported by this host.';
      process.stderr.write(
        `Error: Host "${host.id}" does not support asset type "${item.type}".\n\n` +
          `Reason: ${reason}\n\n` +
          `• View the full host capability matrix: ${README_URL}\n` +
          `• If you believe ${host.displayName} now supports this, feel free to open a PR: ${PR_URL}\n`,
      );
      process.exit(2);
    }
  }

  const expandedItems: Array<{ assetType: AssetType; source: string }> = [];

  for (const item of explicitDescriptors) {
    expandedItems.push({ assetType: item.type, source: item.source });
  }

  for (const desc of packDescriptors) {
    const sources = Array.isArray(desc.source) ? desc.source : [desc.source];
    for (const src of sources) {
      expandedItems.push({ assetType: desc.type, source: src });
    }
  }

  const resolvedItems: Array<{
    assetType: AssetType;
    assetName: string;
    resolved: ResolvedSource;
    fromExplicitFlag: boolean;
  }> = [];

  const tempDirsToClean = new Set<string>();
  const skippedResults: InstallResult[] = [];

  // process.exit() skips `finally`, so every exit path below cleans up
  // explicitly; the `finally` covers normal returns and thrown errors.
  try {
    let explicitCount = explicitDescriptors.length;
    let idx = 0;
    for (const item of expandedItems) {
      const isGlob = item.source.endsWith('/*');
      const cleanSource = isGlob ? item.source.slice(0, -2) : item.source;
      const fromExplicitFlag = idx++ < explicitCount;
      if (!fromExplicitFlag && !host.assets[item.assetType].supported) {
        skippedResults.push({
          job: {
            assetType: item.assetType, assetName: inferName(cleanSource), host,
            resolvedSource: { type: 'local', localPath: '', originalSource: item.source },
          },
          status: 'skipped', reason: host.assets[item.assetType].reason,
        });
        continue;
      }
      const resolved = await resolveSource(cleanSource, cwd);
      if (resolved.tempDir) {
        tempDirsToClean.add(resolved.tempDir);
      }

      if (isGlob) {
        const entries = await expandDirectory(
          resolved.localPath,
          item.assetType,
        );
        if (entries.length === 0) {
          process.stderr.write(
            `agent-add error: No matching files found in directory for ${item.assetType}\n` +
              `  Source: ${item.source}\n`,
          );
          await cleanupTempDirs(tempDirsToClean);
          process.exit(2);
        }
        const dirName = path.basename(resolved.localPath);
        for (const entry of entries) {
          resolvedItems.push({
            assetType: item.assetType,
            assetName: `${dirName}/${entry.assetName}`,
            resolved: { ...resolved, localPath: entry.localPath },
            fromExplicitFlag,
          });
        }
      } else {
        const assetName = inferName(cleanSource, {
          isDirectorySource: item.assetType === 'skill',
        });
        resolvedItems.push({
          assetType: item.assetType,
          assetName,
          resolved,
          fromExplicitFlag,
        });
      }
    }

    for (const item of resolvedItems) {
      const validationError = await validateAsset(
        item.assetType,
        item.resolved,
      );
      if (validationError) {
        process.stderr.write(`agent-add error: ${validationError}\n`);
        process.stderr.write(`  Source: ${item.resolved.originalSource}\n`);
        await cleanupTempDirs(tempDirsToClean);
        process.exit(2);
      }
    }

    const jobs: InstallJob[] = [];

    for (const item of resolvedItems) {
      const capability = host.assets[item.assetType];
      if (!capability.supported) {
        skippedResults.push({
          job: {
            assetType: item.assetType,
            assetName: item.assetName,
            resolvedSource: item.resolved,
            host,
          },
          status: 'skipped',
          reason:
            capability.reason ??
            `${host.displayName} does not support ${item.assetType}`,
        });
      } else {
        jobs.push({
          assetType: item.assetType,
          assetName: item.assetName,
          resolvedSource: item.resolved,
          host,
        });
      }
    }

    const incoming = new Map<string, { job: InstallJob; content: unknown }>();
    const collisions = new Set<InstallJob>();
    const invalid: InstallResult[] = [];
    for (const job of jobs) {
      if (job.assetType === 'skill') continue;
      try {
        let content: unknown = await fs.promises.readFile(
          job.resolvedSource.localPath,
          'utf-8',
        );
        if (job.assetType === 'mcp') {
          const parsed: unknown = JSON.parse(content as string);
          if (!isRecord(parsed))
            throw new Error('MCP source must be a JSON object');
          const wrapped = unwrapMcpServers(parsed);
          if (wrapped) job.assetName = wrapped.name;
          content = convertMcpServer(
            host,
            wrapped?.config ?? parsed,
            job.assetName,
          );
        }
        const key = job.assetType + ':' + job.assetName;
        const previous = incoming.get(key);
        if (previous && !deepEqualIgnoringKeyOrder(previous.content, content)) {
          collisions.add(previous.job);
          collisions.add(job);
        } else if (!previous) incoming.set(key, { job, content });
      } catch (err) {
        invalid.push({ job, status: 'error', reason: (err as Error).message });
      }
    }
    if (collisions.size || invalid.length) {
      return {
        host,
        results: [
          ...skippedResults,
          ...jobs.map((job) => {
            const error = invalid.find((result) => result.job === job);
            if (error) return error;
            return {
              job,
              status: collisions.has(job) ? 'conflict' : 'skipped',
              reason: collisions.has(job)
                ? `Different sources share the ${job.assetType} name '${job.assetName}'; nothing was written`
                : 'Batch blocked by preflight errors or name collisions',
            } as InstallResult;
          }),
        ],
      };
    }

    const results: InstallResult[] = [...skippedResults];

    for (const job of jobs) {
      const handler = getHandler(job.assetType);
      const result = await handler.handle(job);
      results.push(result);
    }

    return { host, results };
  } finally {
    await cleanupTempDirs(tempDirsToClean);
  }
}
