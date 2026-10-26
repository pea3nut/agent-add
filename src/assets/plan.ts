import fs from 'fs';
import path from 'path';
import { parse, stringify } from 'smol-toml';
import { deepEqualIgnoringKeyOrder } from '../utils/deep-equal.js';
import { assertNoSymlinks, equalTrees, isWithin, readTree } from '../utils/safe-path.js';
import { describeSource, redact } from '../utils/redact.js';
import type { AssetHandler, InstallJob, InstallResult, PreparedAsset } from './types.js';

type Snapshot = Buffer | Map<string, Buffer | null> | null;
interface WritePlan {
  targetPath: string;
  before: Snapshot;
  after: Buffer | Map<string, Buffer | null>;
  assets: PreparedAsset[];
  modes?: Map<string, number>;
}

export function createHandler(prepare: AssetHandler['prepare']): AssetHandler {
  return {
    prepare,
    async handle(job) {
      try {
        return (await installPrepared([await prepare(job)], job.overwrite ?? false))[0]!;
      } catch (err) {
        return assetError(job, err);
      }
    },
  };
}

export function assetError(job: InstallJob, err: unknown): InstallResult {
  return { job, status: 'error', reason: redact((err as Error).message ?? String(err)) };
}

function unit(asset: PreparedAsset): string {
  if (asset.kind === 'prompt') return JSON.stringify(['prompt', asset.job.assetName]);
  if (asset.kind.startsWith('mcp-')) return JSON.stringify([asset.kind, asset.configKey, asset.job.assetName]);
  return '';
}

function sameContent(a: PreparedAsset, b: PreparedAsset): boolean {
  if (a.kind !== b.kind) return false;
  if (a.files && b.files) return equalTrees(a.files, b.files);
  if (a.entry && b.entry) return deepEqualIgnoringKeyOrder(a.entry, b.entry);
  return a.content === b.content;
}

function conflict(asset: PreparedAsset, reason: string, canOverwrite = true): InstallResult {
  return { job: asset.job, status: 'conflict', targetPath: asset.targetPath, reason, canOverwrite };
}

function pathKey(target: string): string {
  return process.platform === 'win32' ? target.toLowerCase() : target;
}

async function snapshot(target: string, directory: boolean): Promise<Snapshot> {
  await assertNoSymlinks(target);
  try {
    return directory ? await readTree(target) : await fs.promises.readFile(target);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

function equalSnapshots(a: Snapshot, b: Snapshot): boolean {
  if (a === null || b === null) return a === b;
  if (a instanceof Map && b instanceof Map) return equalTrees(a, b);
  return Buffer.isBuffer(a) && Buffer.isBuffer(b) && a.equals(b);
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function parseDocument(before: Snapshot, kind: PreparedAsset['kind']): Record<string, unknown> {
  const text = Buffer.isBuffer(before) ? before.toString('utf-8') : '';
  if (before === null) return {};
  try {
    return object(kind === 'mcp-json' ? JSON.parse(text) : parse(text), 'Existing config');
  } catch {
    throw new Error(`Failed to parse existing config as ${kind === 'mcp-json' ? 'JSON' : 'TOML'}`);
  }
}

function checkMarkers(text: string): void {
  if ([...text.matchAll(/<!-- \/?agent-add:/g)].length !== [...text.matchAll(/<!-- (\/?)agent-add:([^\r\n]*?) -->/g)].length) {
    throw new Error('Malformed prompt markers');
  }
  const seen = new Set<string>();
  let open: string | undefined;
  for (const match of text.matchAll(/<!-- (\/?)agent-add:([^\r\n]*?) -->/g)) {
    const [, closing, name] = match;
    if (!closing) {
      if (open !== undefined || seen.has(name!)) throw new Error('Malformed or duplicate prompt markers');
      seen.add(name!);
      open = name;
    } else {
      if (open !== name) throw new Error('Malformed or duplicate prompt markers');
      open = undefined;
    }
  }
  if (open !== undefined) throw new Error('Malformed or duplicate prompt markers');
}

function updatePrompt(text: string, asset: PreparedAsset): { existing?: string; updated: string; incoming: string } {
  const open = `<!-- agent-add:${asset.job.assetName} -->`;
  const close = `<!-- /agent-add:${asset.job.assetName} -->`;
  const incoming = `${open}\n${asset.content}\n${close}`;
  const start = text.indexOf(open);
  if (start !== -1) {
    const end = text.indexOf(close, start) + close.length;
    return { existing: text.slice(start, end), incoming, updated: text.slice(0, start) + incoming + text.slice(end) };
  }
  const separator = text && !text.endsWith('\n') ? '\n\n' : text ? '\n' : '';
  return { incoming, updated: text + separator + incoming + '\n' };
}

function updateMcp(doc: Record<string, unknown>, asset: PreparedAsset): unknown {
  const name = asset.job.assetName;
  const key = asset.configKey!;
  if (asset.kind === 'mcp-array') {
    const servers = Object.hasOwn(doc, key) ? doc[key] : [];
    if (!Array.isArray(servers)) throw new Error('Existing mcp_servers must be an array');
    if (servers.some((entry) => typeof object(entry, 'MCP entry')['name'] !== 'string')) {
      throw new Error('Existing MCP array entries must have names');
    }
    const matches = servers.filter((entry) => entry['name'] === name);
    if (matches.length > 1) throw new Error(`Existing MCP config has duplicate entries named '${name}'`);
    const index = servers.findIndex((entry) => entry['name'] === name);
    const existing = index === -1 ? undefined : servers[index];
    if (index === -1) servers.push(asset.entry);
    else servers[index] = asset.entry;
    doc[key] = servers;
    return existing;
  }
  const servers = object(Object.hasOwn(doc, key) ? doc[key] : {}, `Existing ${key}`);
  for (const entry of Object.values(servers)) object(entry, 'Existing MCP server entry');
  const existing = Object.hasOwn(servers, name) ? servers[name] : undefined;
  Object.defineProperty(servers, name, { value: asset.entry, enumerable: true, configurable: true, writable: true });
  Object.defineProperty(doc, key, { value: servers, enumerable: true, configurable: true, writable: true });
  return existing;
}

async function assertWritable(target: string): Promise<void> {
  try {
    await fs.promises.access(target, fs.constants.W_OK);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
  let dir = path.dirname(target);
  for (;;) {
    try {
      await fs.promises.access(dir, fs.constants.W_OK | fs.constants.X_OK);
      return;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      const parent = path.dirname(dir);
      if (parent === dir) throw err;
      dir = parent;
    }
  }
}

export async function installPrepared(
  assets: PreparedAsset[],
  overwrite: boolean,
  errors: InstallResult[] = [],
): Promise<InstallResult[]> {
  const results = new Map<PreparedAsset, InstallResult>();
  const byUnit = new Map<string, PreparedAsset[]>();
  for (const asset of assets) {
    const key = JSON.stringify([pathKey(asset.targetPath), unit(asset)]);
    const group = byUnit.get(key) ?? [];
    group.push(asset);
    byUnit.set(key, group);
  }
  const winners = new Set<PreparedAsset>();
  for (const group of byUnit.values()) {
    const first = group[0]!;
    if (!overwrite && group.some((asset) => !sameContent(first, asset))) {
      const sources = group.map((asset) => describeSource(asset.job.resolvedSource.originalSource)).join(', ');
      for (const asset of group) results.set(asset, conflict(asset, `Duplicate inputs have different content. Sources: ${sources}. The last declared source wins with --overwrite.`));
      continue;
    }
    const winner = overwrite ? group[group.length - 1]! : first;
    winners.add(winner);
    for (const asset of group) {
      if (asset === winner) continue;
      results.set(asset, {
        job: asset.job, status: 'skipped', targetPath: asset.targetPath,
        reason: `${describeSource(asset.job.resolvedSource.originalSource)}: ${sameContent(asset, winner) ? 'identical duplicate of' : 'replaced by later source'} ${describeSource(winner.job.resolvedSource.originalSource)}`,
      });
    }
  }

  // A shared document may contain independent entries, but a whole-file or
  // directory write must never overlap another installation target.
  for (let i = 0; i < assets.length; i++) {
    for (let j = i + 1; j < assets.length; j++) {
      const a = assets[i]!;
      const b = assets[j]!;
      const aPath = pathKey(a.targetPath);
      const bPath = pathKey(b.targetPath);
      const samePath = aPath === bPath;
      const shared = a.kind === b.kind && a.kind !== 'file' && a.kind !== 'skill';
      if ((samePath && !shared && unit(a) !== unit(b)) ||
          (samePath && a.kind !== b.kind) ||
          (samePath && a.job.assetType !== b.job.assetType) ||
          (!samePath && (isWithin(aPath, bPath) || isWithin(bPath, aPath)))) {
        const reason = `Incompatible overlapping targets: ${a.targetPath} and ${b.targetPath}`;
        results.set(a, conflict(a, reason, false));
        results.set(b, conflict(b, reason, false));
        winners.delete(a);
        winners.delete(b);
      }
    }
  }

  const groups = new Map<string, PreparedAsset[]>();
  for (const asset of assets) {
    if (!winners.has(asset)) continue;
    const key = pathKey(asset.targetPath);
    const group = groups.get(key) ?? [];
    group.push(asset);
    groups.set(key, group);
  }
  const plans: WritePlan[] = [];
  for (const group of groups.values()) {
    const first = group[0]!;
    try {
      const before = await snapshot(first.targetPath, first.kind === 'skill');
      let after: WritePlan['after'];
      let modes = first.modes;
      if (first.kind === 'skill') {
        const source = await fs.promises.realpath(first.job.resolvedSource.localPath);
        const target = path.resolve(first.targetPath);
        if (pathKey(source) !== pathKey(target) && (isWithin(pathKey(source), pathKey(target)) || isWithin(pathKey(target), pathKey(source)))) {
          throw new Error('Skill source and target directories overlap');
        }
        const existing = before instanceof Map ? before : null;
        if (existing?.has('SKILL.md') && !Buffer.isBuffer(existing.get('SKILL.md'))) throw new Error('Existing SKILL.md is not a regular file');
        const same = existing !== null && equalTrees(existing, first.files!);
        const incomplete = existing !== null && !existing.has('SKILL.md');
        if (existing && !same && !incomplete && !overwrite) {
          results.set(first, conflict(first, `Existing skill directory has different content: ${first.targetPath}`));
        } else {
          results.set(first, { job: first.job, targetPath: first.targetPath, status: same ? 'exists' : incomplete && !overwrite ? 'written' : before === null ? 'written' : 'updated' });
        }
        after = !overwrite && incomplete ? new Map([...existing!, ...first.files!]) : first.files!;
        if (!overwrite && incomplete) {
          const existingModes = new Map<string, number>();
          await readTree(first.targetPath, existingModes);
          modes = new Map([...existingModes, ...first.modes!]);
        }
      } else if (first.kind === 'file') {
        const incoming = Buffer.from(first.content!);
        const same = Buffer.isBuffer(before) && before.equals(incoming);
        results.set(first, before !== null && !same && !overwrite
          ? conflict(first, `Existing file has different content: ${first.targetPath}`)
          : { job: first.job, targetPath: first.targetPath, status: same ? 'exists' : before === null ? 'written' : 'updated' });
        after = incoming;
      } else {
        const doc = first.kind === 'prompt' ? null : parseDocument(before, first.kind);
        let text = Buffer.isBuffer(before) ? before.toString('utf-8') : '';
        if (first.kind === 'prompt') checkMarkers(text);
        for (const asset of group) {
          let existing: unknown;
          let same: boolean;
          if (asset.kind === 'prompt') {
            const update = updatePrompt(text, asset);
            existing = update.existing;
            same = existing === update.incoming;
            text = update.updated;
          } else {
            existing = updateMcp(doc!, asset);
            same = deepEqualIgnoringKeyOrder(existing, asset.entry);
          }
          results.set(asset, existing !== undefined && !same && !overwrite
            ? conflict(asset, `Existing target entry '${asset.job.assetName}' has different content: ${asset.targetPath}`)
            : { job: asset.job, targetPath: asset.targetPath, status: same ? 'exists' : existing === undefined ? 'written' : 'updated' });
        }
        after = Buffer.from(first.kind === 'prompt' ? text : first.kind === 'mcp-json' ? JSON.stringify(doc, null, 2) + '\n' : stringify(doc!));
      }
      const changed = group.some((asset) => ['written', 'updated'].includes(results.get(asset)!.status));
      if (changed) {
        await assertWritable(first.targetPath);
        plans.push({ targetPath: first.targetPath, before, after, assets: group, modes });
      }
    } catch (err) {
      for (const asset of group) results.set(asset, { ...assetError(asset.job, err), targetPath: asset.targetPath });
    }
  }
  if (errors.length > 0 || [...results.values()].some((result) => result.status === 'conflict' || result.status === 'error')) {
    for (const [asset, result] of results) {
      if (result.status === 'written' || result.status === 'updated') {
        results.set(asset, { ...result, status: 'skipped', reason: 'Not installed because preflight failed; no target files were changed' });
      }
    }
  } else {
    for (const plan of plans) {
      try {
        await applyWrite(plan);
      } catch (err) {
        for (const asset of plan.assets) results.set(asset, { ...assetError(asset.job, err), targetPath: asset.targetPath });
      }
    }
  }
  return [...assets.map((asset) => results.get(asset)!), ...errors];
}

async function populate(root: string, files: Map<string, Buffer | null>, modes?: Map<string, number>): Promise<void> {
  for (const [relative, content] of files) {
    const dest = path.join(root, relative);
    await fs.promises.mkdir(content === null ? dest : path.dirname(dest), { recursive: true });
    if (content !== null) await fs.promises.writeFile(dest, content);
  }
  for (const relative of [...files.keys()].sort((a, b) => b.length - a.length)) {
    const mode = modes?.get(relative);
    if (mode !== undefined) await fs.promises.chmod(path.join(root, relative), mode);
  }
}

async function applyWrite(plan: WritePlan): Promise<void> {
  const directory = plan.after instanceof Map;
  const unchanged = async () => {
    if (!equalSnapshots(plan.before, await snapshot(plan.targetPath, directory))) {
      throw new Error(`Target changed after preflight; refusing to overwrite: ${plan.targetPath}`);
    }
  };
  await unchanged();
  const parent = path.dirname(plan.targetPath);
  await fs.promises.mkdir(parent, { recursive: true });
  const stage = await fs.promises.mkdtemp(path.join(parent, '.agent-add-stage-'));
  const incoming = path.join(stage, 'incoming');
  const backup = path.join(stage, 'previous');
  let backedUp = false;
  let preserveBackup = false;
  try {
    if (plan.after instanceof Map) {
      await fs.promises.mkdir(incoming);
      await populate(incoming, plan.after, plan.modes);
    } else {
      await fs.promises.writeFile(incoming, plan.after);
      if (plan.before !== null) {
        const stat = await fs.promises.stat(plan.targetPath);
        await fs.promises.chmod(incoming, stat.mode & 0o777);
      }
    }
    await unchanged();
    if (directory && plan.before !== null) {
      await fs.promises.rename(plan.targetPath, backup);
      backedUp = true;
    }
    try {
      if (backedUp && !equalSnapshots(plan.before, await snapshot(backup, true))) {
        throw new Error(`Target changed after preflight; refusing to overwrite: ${plan.targetPath}`);
      }
      if (!directory && plan.before === null) {
        await fs.promises.link(incoming, plan.targetPath);
      } else {
        await fs.promises.rename(incoming, plan.targetPath);
      }
    } catch (err) {
      if (backedUp) {
        try {
          await fs.promises.rename(backup, plan.targetPath);
          backedUp = false;
        } catch {
          preserveBackup = true;
          throw new Error(`Failed to restore previous skill; recovery copy retained at ${backup}`);
        }
      }
      throw err;
    }
  } finally {
    if (!preserveBackup) await fs.promises.rm(stage, { recursive: true, force: true });
  }
}
