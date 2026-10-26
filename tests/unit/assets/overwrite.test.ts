import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runInstaller, type CliInput, type OrderedInput } from '../../../src/installer.js';
import { getHost } from '../../../src/hosts/index.js';
import { commandHandler } from '../../../src/assets/command.js';
import { skillHandler } from '../../../src/assets/skill.js';
import { installPrepared } from '../../../src/assets/plan.js';
import { formatSummary } from '../../../src/utils/summary.js';
import type { InstallJob, PreparedAsset } from '../../../src/assets/types.js';

let root: string;
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-add-overwrite-')); });
afterEach(() => { vi.restoreAllMocks(); fs.rmSync(root, { recursive: true, force: true }); });

function write(name: string, content: string): string {
  const dest = path.join(root, name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
  return dest;
}

function run(inputs: OrderedInput[], overwrite = false, host = getHost('claude-code')!) {
  const input: CliInput = { mcp: [], skill: [], prompt: [], command: [], subAgent: [], pack: [], inputs, overwrite };
  return runInstaller(input, host, root);
}

function job(type: InstallJob['assetType'], source: string, name = 'review'): InstallJob {
  return { assetType: type, assetName: name, cwd: root, host: getHost('claude-code')!,
    resolvedSource: { type: 'local', localPath: source, originalSource: source } };
}

describe('install preflight and overwrite', () => {
  it('aborts the whole batch before creating targets on duplicate input conflicts', async () => {
    const summary = await run([
      { type: 'command', source: write('unique.md', 'unique') },
      { type: 'prompt', source: write('a/review.md', 'a') },
      { type: 'prompt', source: write('b/review.md', 'b') },
    ]);
    expect(summary.results.map((r) => r.status)).toEqual(['skipped', 'conflict', 'conflict']);
    expect(fs.existsSync(path.join(root, '.claude'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'CLAUDE.md'))).toBe(false);
    expect(formatSummary(summary)).toContain('re-run the same command with --overwrite');
    expect(formatSummary(summary)).toContain('last declared source wins');
  });

  it('coalesces identical inputs without writing twice', async () => {
    const summary = await run(['a', 'b'].map((dir) => ({ type: 'command', source: write(`${dir}/review.md`, 'same') })));
    expect(summary.results.map((r) => r.status)).toEqual(['written', 'skipped']);
    expect(fs.readFileSync(path.join(root, '.claude/commands/review.md'), 'utf8')).toBe('same');
  });

  it('last input wins without writing intermediate versions', async () => {
    const summary = await run(['a', 'b', 'c'].map((dir) => ({ type: 'prompt', source: write(`${dir}/review.md`, dir) })), true);
    expect(summary.results.map((r) => r.status)).toEqual(['skipped', 'skipped', 'written']);
    expect(fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8')).toContain('\nc\n');
    expect(formatSummary(summary)).toContain('replaced by later source');
  });

  it.each([false, true])('expands packs in place, reversed=%s', async (reverse) => {
    const a = write('a/review.md', 'pack');
    const b = write('b/review.md', 'explicit');
    const pack = write('pack.json', JSON.stringify({ name: 'test/pack', assets: [{ type: 'command', source: [a] }] }));
    const inputs: OrderedInput[] = [{ type: 'pack', source: pack }, { type: 'command', source: b }];
    await run(reverse ? inputs.reverse() : inputs, true);
    expect(fs.readFileSync(path.join(root, '.claude/commands/review.md'), 'utf8')).toBe(reverse ? 'pack' : 'explicit');
  });

  it('compares the winning input to disk, not an intermediate loser', async () => {
    const target = write('.claude/commands/review.md', 'original');
    const mtime = fs.statSync(target).mtimeMs;
    const summary = await run(['changed', 'original'].map((value, i) => ({ type: 'command', source: write(`${i}/review.md`, value) })), true);
    expect(summary.results.map((r) => r.status)).toEqual(['skipped', 'exists']);
    expect(fs.statSync(target).mtimeMs).toBe(mtime);
  });

  it('does not hide malformed shadowed inputs with overwrite', async () => {
    const summary = await run([
      { type: 'mcp', source: write('a/tool.json', '{broken') },
      { type: 'mcp', source: write('b/tool.json', '{"command":"good"}') },
    ], true);
    expect(summary.results.some((r) => r.status === 'error')).toBe(true);
    expect(fs.existsSync(path.join(root, '.mcp.json'))).toBe(false);
  });

  it('requires overwrite for changed prompts while preserving unrelated text', async () => {
    const source = write('review.md', 'first');
    await run([{ type: 'prompt', source }]);
    const target = path.join(root, 'CLAUDE.md');
    fs.appendFileSync(target, '\nUser notes\n');
    const before = fs.readFileSync(target, 'utf8');
    write('review.md', 'second');
    const conflict = await run([{ type: 'prompt', source }]);
    expect(conflict.results[0].status).toBe('conflict');
    expect(fs.readFileSync(target, 'utf8')).toBe(before);
    const updated = await run([{ type: 'prompt', source }], true);
    expect(updated.results[0].status).toBe('updated');
    expect(fs.readFileSync(target, 'utf8')).toBe(before.replace('first', 'second'));
  });

  it('combines independent prompt entries in a single shared-file write', async () => {
    write('CLAUDE.md', 'user notes\n');
    const rename = vi.spyOn(fs.promises, 'rename');
    await run(['one', 'two'].map((name) => ({ type: 'prompt', source: write(`${name}.md`, name) })));
    expect(rename.mock.calls.filter(([, to]) => to === path.join(root, 'CLAUDE.md'))).toHaveLength(1);
    expect(fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8')).toContain('agent-add:two');
  });

  it.each(['<!-- agent-add:review -->\nbroken', '<!-- agent-add:review'])('rejects malformed markers even with overwrite: %s', async (content) => {
    write('CLAUDE.md', content);
    const summary = await run([{ type: 'prompt', source: write('review.md', 'new') }], true);
    expect(summary.results[0].status).toBe('error');
    expect(formatSummary(summary)).not.toContain('re-run the same command with --overwrite');
    expect(fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8')).toBe(content);
  });

  it('uses effective MCP server names, ignoring JSON key order', async () => {
    const summary = await run([
      { type: 'mcp', source: write('a.json', '{"mcpServers":{"tool":{"command":"node","env":{"B":"2","A":"1"}}}}') },
      { type: 'mcp', source: write('b.json', '{"mcpServers":{"tool":{"env":{"A":"1","B":"2"},"command":"node"}}}') },
    ]);
    expect(summary.results.map((r) => r.status)).toEqual(['written', 'skipped']);
    expect(summary.results[0].job.assetName).toBe('tool');
  });

  it('overwrites just the selected JSON MCP entry', async () => {
    write('.mcp.json', '{"custom":true,"mcpServers":{"keep":{"command":"keep"},"tool":{"command":"old"}}}');
    const summary = await run([{ type: 'mcp', source: write('tool.json', '{"command":"new"}') }], true);
    expect(summary.results[0].status).toBe('updated');
    expect(JSON.parse(fs.readFileSync(path.join(root, '.mcp.json'), 'utf8'))).toEqual({ custom: true, mcpServers: { keep: { command: 'keep' }, tool: { command: 'new' } } });
  });

  it.each(['codex', 'vibe'])('preserves unrelated TOML config during overwrite for %s', async (id) => {
    const host = structuredClone(getHost(id)!);
    host.assets.mcp.configFile = path.join(root, 'config.toml');
    const existing = id === 'vibe'
      ? 'theme = "dark"\n[[mcp_servers]]\nname = "keep"\ncommand = "keep"\n[[mcp_servers]]\nname = "tool"\ncommand = "old"\n'
      : 'theme = "dark"\n[mcp_servers.keep]\ncommand = "keep"\n[mcp_servers.tool]\ncommand = "old"\n';
    write('config.toml', existing);
    const summary = await run([{ type: 'mcp', source: write('tool.json', '{"command":"new"}') }], true, host);
    expect(summary.results[0].status).toBe('updated');
    const content = fs.readFileSync(path.join(root, 'config.toml'), 'utf8');
    expect(content).toContain('theme = "dark"');
    expect(content).toContain('command = "keep"');
    expect(content).toContain('command = "new"');
    expect(content).not.toContain('command = "old"');
  });

  it.each(['{broken', 'null', '{"mcpServers":[]}', '{"mcpServers":null}', '{"mcpServers":{"tool":null}}'])('never overwrites invalid JSON config: %s', async (content) => {
    write('.mcp.json', content);
    const summary = await run([{ type: 'mcp', source: write('tool.json', '{"command":"new"}') }], true);
    expect(summary.results[0].status).toBe('error');
    expect(fs.readFileSync(path.join(root, '.mcp.json'), 'utf8')).toBe(content);
  });

  it('detects skill auxiliary changes and replaces the entire directory only with overwrite', async () => {
    const source = path.dirname(write('pdf/SKILL.md', 'skill'));
    write('pdf/helper.sh', '#!/bin/sh\necho new');
    fs.chmodSync(path.join(source, 'helper.sh'), 0o755);
    write('.claude/skills/pdf/SKILL.md', 'skill');
    write('.claude/skills/pdf/obsolete', 'obsolete');
    write('.claude/skills/keep/SKILL.md', 'keep');
    const conflict = await run([{ type: 'skill', source }]);
    expect(conflict.results[0].status).toBe('conflict');
    expect(fs.existsSync(path.join(root, '.claude/skills/pdf/obsolete'))).toBe(true);
    const updated = await run([{ type: 'skill', source }], true);
    expect(updated.results[0].status).toBe('updated');
    expect(fs.existsSync(path.join(root, '.claude/skills/pdf/obsolete'))).toBe(false);
    expect(fs.readFileSync(path.join(root, '.claude/skills/keep/SKILL.md'), 'utf8')).toBe('keep');
    if (process.platform !== 'win32') expect(fs.statSync(path.join(root, '.claude/skills/pdf/helper.sh')).mode & 0o777).toBe(0o755);
  });

  it('retains incomplete skill recovery and unrelated auxiliary files without the option', async () => {
    const source = path.dirname(write('pdf/SKILL.md', 'skill'));
    write('pdf/helper', 'new');
    write('.claude/skills/pdf/helper', 'old');
    write('.claude/skills/pdf/extra', 'keep');
    const summary = await run([{ type: 'skill', source }]);
    expect(summary.results[0].status).toBe('written');
    expect(fs.readFileSync(path.join(root, '.claude/skills/pdf/helper'), 'utf8')).toBe('new');
    expect(fs.existsSync(path.join(root, '.claude/skills/pdf/extra'))).toBe(true);
  });

  it('restores an installed skill when directory switching fails', async () => {
    const source = path.dirname(write('pdf/SKILL.md', 'new'));
    const target = path.dirname(write('.claude/skills/pdf/SKILL.md', 'old'));
    const rename = fs.promises.rename.bind(fs.promises);
    vi.spyOn(fs.promises, 'rename').mockImplementation(async (from, to) => {
      if (String(from).endsWith(`${path.sep}incoming`) && to === target) throw new Error('Injected switch failure');
      return rename(from, to);
    });
    const summary = await run([{ type: 'skill', source }], true);
    expect(summary.results[0].status).toBe('error');
    expect(fs.readFileSync(path.join(target, 'SKILL.md'), 'utf8')).toBe('old');
    expect(fs.readdirSync(path.dirname(target))).toEqual(['pdf']);
  });

  it('refuses symlink targets without affecting their destinations', async () => {
    const outside = write('outside.md', 'keep');
    fs.symlinkSync(outside, path.join(root, 'CLAUDE.md'));
    const summary = await run([{ type: 'prompt', source: write('review.md', 'new') }], true);
    expect(summary.results[0].status).toBe('error');
    expect(fs.readFileSync(outside, 'utf8')).toBe('keep');
  });

  it('refuses parent/child and cross-type targets even with overwrite', async () => {
    const a = await commandHandler.prepare(job('command', write('a.md', 'a')));
    const b: PreparedAsset = { ...a, job: { ...a.job, assetType: 'subAgent' } };
    let results = await installPrepared([a, b], true);
    expect(results.every((r) => r.status === 'conflict' && r.canOverwrite === false)).toBe(true);
    results = await installPrepared([a, { ...a, targetPath: path.join(a.targetPath, 'nested') }], true);
    expect(results.every((r) => r.status === 'conflict' && r.canOverwrite === false)).toBe(true);
    expect(fs.existsSync(path.join(root, '.claude'))).toBe(false);
  });

  it('does not destroy a skill when the source is already its target', async () => {
    const source = path.dirname(write('.claude/skills/pdf/SKILL.md', 'keep'));
    const summary = await run([{ type: 'skill', source }], true);
    expect(summary.results[0].status).toBe('exists');
    expect(fs.readFileSync(path.join(source, 'SKILL.md'), 'utf8')).toBe('keep');
  });

  it('detects target edits between preflight and commit', async () => {
    const source = write('review.md', 'new');
    const target = write('.claude/commands/review.md', 'old');
    const writeFile = fs.promises.writeFile.bind(fs.promises);
    vi.spyOn(fs.promises, 'writeFile').mockImplementation(async (dest, ...args) => {
      if (String(dest).endsWith(`${path.sep}incoming`)) fs.writeFileSync(target, 'user edit');
      return writeFile(dest, ...args);
    });
    const summary = await run([{ type: 'command', source }], true);
    expect(summary.results[0].status).toBe('error');
    expect(summary.results[0].reason).toContain('changed after preflight');
    expect(fs.readFileSync(target, 'utf8')).toBe('user edit');
  });

  it('does not replace a new file created after preflight', async () => {
    const source = write('review.md', 'agent content');
    const target = path.join(root, '.claude/commands/review.md');
    const link = fs.promises.link.bind(fs.promises);
    vi.spyOn(fs.promises, 'link').mockImplementation(async (from, to) => {
      if (to === target) fs.writeFileSync(target, 'user content');
      return link(from, to);
    });
    const summary = await run([{ type: 'command', source }], true);
    expect(summary.results[0].status).toBe('error');
    expect(fs.readFileSync(target, 'utf8')).toBe('user content');
  });

  it('restores a skill if the directory changes during the final switch', async () => {
    const source = path.dirname(write('pdf/SKILL.md', 'new'));
    const target = path.dirname(write('.claude/skills/pdf/SKILL.md', 'old'));
    const rename = fs.promises.rename.bind(fs.promises);
    vi.spyOn(fs.promises, 'rename').mockImplementation(async (from, to) => {
      if (from === target && String(to).endsWith(`${path.sep}previous`)) {
        fs.writeFileSync(path.join(target, 'SKILL.md'), 'user edit');
      }
      return rename(from, to);
    });
    const summary = await run([{ type: 'skill', source }], true);
    expect(summary.results[0].status).toBe('error');
    expect(fs.readFileSync(path.join(target, 'SKILL.md'), 'utf8')).toBe('user edit');
  });

  it('does not leak credentials or signed queries in conflict summaries', async () => {
    const a = await commandHandler.prepare(job('command', write('a.md', 'a')));
    const b = await commandHandler.prepare(job('command', write('b.md', 'b')));
    a.job.resolvedSource.originalSource = 'https://user:password@example.com/a.md?token=secret';
    b.job.resolvedSource.originalSource = '{"command":"secret-inline-value"}';
    const summary = formatSummary({ host: a.job.host, results: await installPrepared([a, b], false) });
    expect(summary).not.toMatch(/password|token=secret|secret-inline-value/);
    expect(summary).toContain('--overwrite');
  });

  it('does not rewrite an identical JSON config with reordered keys', async () => {
    const existing = '{"mcpServers":{"tool":{"env":{"B":"2","A":"1"},"command":"node"}}}';
    write('.mcp.json', existing);
    const summary = await run([{ type: 'mcp', source: write('tool.json', '{"command":"node","env":{"A":"1","B":"2"}}') }]);
    expect(summary.results[0].status).toBe('exists');
    expect(fs.readFileSync(path.join(root, '.mcp.json'), 'utf8')).toBe(existing);
  });

  it.each(['claude-code', 'codex', 'vibe'])('detects duplicate MCP names and array order changes for %s', async (id) => {
    const host = structuredClone(getHost(id)!);
    host.assets.mcp.configFile = path.join(root, id === 'claude-code' ? 'config.json' : 'config.toml');
    const inputs: OrderedInput[] = ['a', 'b'].map((value, i) => ({ type: 'mcp', source: write(`${value}.json`, JSON.stringify({ mcpServers: { tool: { command: 'node', args: i === 0 ? ['a', 'b'] : ['b', 'a'] } } })) }));
    const conflict = await run(inputs, false, host);
    expect(conflict.results.every((r) => r.status === 'conflict')).toBe(true);
    expect(fs.existsSync(String(host.assets.mcp.configFile))).toBe(false);
    const overwritten = await run(inputs, true, host);
    expect(overwritten.results.map((r) => r.status)).toEqual(['skipped', 'written']);
    const again = await run([inputs[1]], true, host);
    expect(again.results[0].status).toBe('exists');
  });

  it('batches independent MCP server entries in one config write', async () => {
    write('.mcp.json', '{}');
    const rename = vi.spyOn(fs.promises, 'rename');
    await run(['one', 'two'].map((name) => ({ type: 'mcp', source: write(`${name}.json`, '{"command":"node"}') })));
    expect(rename.mock.calls.filter(([, to]) => to === path.join(root, '.mcp.json'))).toHaveLength(1);
    expect(Object.keys(JSON.parse(fs.readFileSync(path.join(root, '.mcp.json'), 'utf8')).mcpServers)).toEqual(['one', 'two']);
  });

  it('compares sub-agent content after applying host-specific hints', async () => {
    const summary = await run(['a', 'b'].map((value) => ({ type: 'subAgent', source: write(`${value}/review.md`, `---\ndescription: review\nagent-add/cursor/description: ${value}\n---\nbody`) })));
    expect(summary.results.map((r) => r.status)).toEqual(['written', 'skipped']);
  });

  it('protects and overwrites standalone prompts', async () => {
    const host = getHost('roo-code')!;
    const target = write('.roo/rules/review.md', 'old');
    const input: OrderedInput[] = [{ type: 'prompt', source: write('review.md', 'new') }];
    expect((await run(input, false, host)).results[0].status).toBe('conflict');
    expect(fs.readFileSync(target, 'utf8')).toBe('old');
    expect((await run(input, true, host)).results[0].status).toBe('updated');
    expect(fs.readFileSync(target, 'utf8')).toBe('new');
  });

  it('compares hidden skill files and does not rewrite identical directory contents', async () => {
    const source = path.dirname(write('pdf/SKILL.md', 'skill'));
    write('pdf/.hidden', 'first');
    const inputs: OrderedInput[] = [{ type: 'skill', source }];
    await run(inputs);
    expect((await run(inputs)).results[0].status).toBe('exists');
    write('pdf/.hidden', 'second');
    expect((await run(inputs)).results[0].status).toBe('conflict');
    expect((await run(inputs, true)).results[0].status).toBe('updated');
  });

  it('rejects source symlinks and source/target ancestor overlap', async () => {
    const source = path.dirname(write('pdf/SKILL.md', 'skill'));
    fs.symlinkSync(write('outside', 'keep'), path.join(source, 'link'));
    expect((await run([{ type: 'skill', source }], true)).results[0].status).toBe('error');
    fs.unlinkSync(path.join(source, 'link'));
    const skillJob = job('skill', source, 'nested');
    skillJob.host = structuredClone(skillJob.host);
    skillJob.host.assets.skill.installDir = source;
    const result = await skillHandler.handle({ ...skillJob, overwrite: true });
    expect(result.status).toBe('error');
    expect(result.reason).toContain('overlap');
  });

  it('never bypasses permission or path validation errors', async () => {
    const source = write('review.md', 'new');
    const unsafe = await commandHandler.handle({ ...job('command', source, '../../../escape'), overwrite: true });
    expect(unsafe.status).toBe('error');
    const access = fs.promises.access.bind(fs.promises);
    vi.spyOn(fs.promises, 'access').mockImplementation(async (target, mode) => {
      if (mode !== undefined && (mode & fs.constants.W_OK)) throw Object.assign(new Error('EACCES: denied'), { code: 'EACCES' });
      return access(target, mode);
    });
    const summary = await run([{ type: 'command', source }], true);
    expect(summary.results[0].status).toBe('error');
    expect(fs.existsSync(path.join(root, '.claude'))).toBe(false);
  });

  it('keeps glob expansion sorted and uses expanded names for collisions', async () => {
    write('team-b/commands/z.md', 'z');
    write('team-b/commands/review.md', 'b');
    write('team-a/commands/review.md', 'a');
    const summary = await run([{ type: 'command', source: path.join(root, 'team-b/commands/*') }, { type: 'command', source: path.join(root, 'team-a/commands/*') }], true);
    expect(summary.results.map((r) => r.job.assetName)).toEqual(['commands/review', 'commands/z', 'commands/review']);
    expect(fs.readFileSync(path.join(root, '.claude/commands/commands/review.md'), 'utf8')).toBe('a');
  });
});
