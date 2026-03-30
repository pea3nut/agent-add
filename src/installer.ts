import fs from 'fs';
import path from 'path';
import type { AssetType, HostConfig } from './hosts/types.js';
import type { AssetDescriptor } from './manifest/schema.js';
import type { InstallJob, InstallResult, ResolvedSource } from './assets/types.js';
import { resolveSource } from './source/index.js';
import { inferName } from './source/infer-name.js';
import { loadManifest } from './manifest/parser.js';
import { mcpHandler } from './assets/mcp.js';
import { skillHandler } from './assets/skill.js';
import { promptHandler } from './assets/prompt.js';
import { commandHandler } from './assets/command.js';
import { subAgentHandler } from './assets/sub-agent.js';
import type { InstallSummary } from './utils/summary.js';

const README_URL = 'https://github.com/pea3nut/agent-get/blob/main/src/hosts/README.md';
const PR_URL = 'https://github.com/pea3nut/agent-get/pulls';

export interface CliInput {
  mcp: string[];
  skill: string[];
  prompt: string[];
  command: string[];
  subAgent: string[];
  pack: string[];
  host?: string;
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

async function validateAsset(
  assetType: AssetType,
  resolved: ResolvedSource,
): Promise<string | null> {
  if (assetType === 'skill') {
    if (resolved.type === 'http-file') {
      return 'Skill 资产必须指向目录来源（本地路径或 Git URL），不支持直接 HTTP(S) URL';
    }
    const skillMdPath = path.join(resolved.localPath, 'SKILL.md');
    try {
      await fs.promises.access(skillMdPath);
    } catch {
      return `Skill 目录内缺少 SKILL.md 文件（期望路径：${skillMdPath}）`;
    }
    return null;
  }

  if (assetType === 'mcp') {
    try {
      await fs.promises.access(resolved.localPath);
    } catch {
      return `MCP 来源文件不存在：${resolved.localPath}`;
    }
    if (!resolved.localPath.endsWith('.json')) {
      return `MCP 来源文件扩展名必须为 .json（得到：${resolved.localPath}）`;
    }
    return null;
  }

  if (assetType === 'prompt' || assetType === 'command' || assetType === 'subAgent') {
    try {
      await fs.promises.access(resolved.localPath);
    } catch {
      return `来源文件不存在：${resolved.localPath}`;
    }
    if (!resolved.localPath.endsWith('.md')) {
      return `${assetType} 来源文件扩展名必须为 .md（得到：${resolved.localPath}）`;
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
      const reason = capability.reason ?? 'This asset type is not supported by this host.';
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

  let explicitCount = explicitDescriptors.length;
  let idx = 0;
  for (const item of expandedItems) {
    const resolved = await resolveSource(item.source, cwd);
    const assetName = inferName(item.source);
    resolvedItems.push({
      assetType: item.assetType,
      assetName,
      resolved,
      fromExplicitFlag: idx < explicitCount,
    });
    idx++;
  }

  for (const item of resolvedItems) {
    const validationError = await validateAsset(item.assetType, item.resolved);
    if (validationError) {
      process.stderr.write(`agent-get error: ${validationError}\n`);
      process.stderr.write(`  Source: ${item.resolved.originalSource}\n`);
      process.exit(2);
    }
  }

  const jobs: InstallJob[] = [];
  const skippedResults: InstallResult[] = [];

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
        reason: capability.reason ?? `${host.displayName} does not support ${item.assetType}`,
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

  const results: InstallResult[] = [...skippedResults];

  for (const job of jobs) {
    const handler = getHandler(job.assetType);
    const result = await handler.handle(job);
    results.push(result);
  }

  for (const item of resolvedItems) {
    if (item.resolved.tempDir) {
      try {
        const fs2 = await import('fs');
        await fs2.promises.rm(item.resolved.tempDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
    }
  }

  return { host, results };
}
