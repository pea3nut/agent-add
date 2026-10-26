import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const bin = path.resolve(__dirname, '../../bin/agent-add.js');
let root: string;
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-add-overwrite-cli-')); });
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

function write(name: string, content: string): string {
  const dest = path.join(root, name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
  return dest;
}

function cli(args: string[]): Promise<{ code: number; output: string }> {
  return new Promise((resolve) => {
    execFile(process.execPath, [bin, ...args], { cwd: root, env: { ...process.env, AGENT_ADD_HOME: root } }, (err, stdout, stderr) => {
      resolve({ code: err ? Number(err.code ?? 1) : 0, output: stdout + stderr });
    });
  });
}

describe('--overwrite built CLI contract', () => {
  it('guides a conflicting invocation to a successful explicit overwrite', async () => {
    write('a/review.md', 'first');
    write('b/review.md', 'last');
    const args = ['--command', './a/review.md', '--command', './b/review.md', '--host', 'claude-code'];
    const conflict = await cli(args);
    expect(conflict.code).toBe(1);
    expect(conflict.output).toContain('re-run the same command with --overwrite');
    expect(conflict.output).toContain('last declared source wins');
    expect(fs.existsSync(path.join(root, '.claude'))).toBe(false);
    const overwritten = await cli([...args, '--overwrite']);
    expect(overwritten.code).toBe(0);
    expect(overwritten.output).toContain('replaced by later source');
    expect(fs.readFileSync(path.join(root, '.claude/commands/review.md'), 'utf8')).toBe('last');
  });

  it.each([false, true])('honors pack/flag CLI position, reversed=%s', async (reverse) => {
    write('a/review.md', 'pack');
    write('b/review.md', 'explicit');
    write('pack.json', JSON.stringify({ name: 'test/pack', assets: [{ type: 'command', source: './a/review.md' }] }));
    const pack = ['--pack', './pack.json'];
    const explicit = ['--command', './b/review.md'];
    const result = await cli([...(reverse ? [...explicit, ...pack] : [...pack, ...explicit]), '--host', 'claude-code', '--overwrite']);
    expect(result.code).toBe(0);
    expect(fs.readFileSync(path.join(root, '.claude/commands/review.md'), 'utf8')).toBe(reverse ? 'pack' : 'explicit');
  });

  it('honors multiple packs and manifest array order', async () => {
    write('a/review.md', 'first');
    write('b/review.md', 'second');
    write('c/review.md', 'last');
    write('one.json', JSON.stringify({ name: 'test/one', assets: [{ type: 'command', source: ['./a/review.md', './b/review.md'] }] }));
    write('two.json', JSON.stringify({ name: 'test/two', assets: [{ type: 'command', source: './c/review.md' }] }));
    const result = await cli(['--pack', './one.json', '--pack', './two.json', '--host', 'claude-code', '--overwrite']);
    expect(result.code).toBe(0);
    expect(fs.readFileSync(path.join(root, '.claude/commands/review.md'), 'utf8')).toBe('last');
  });

  it('requires overwrite for an existing prompt and retains user text', async () => {
    write('review.md', 'first');
    const args = ['--prompt', './review.md', '--host', 'claude-code'];
    expect((await cli(args)).code).toBe(0);
    fs.appendFileSync(path.join(root, 'CLAUDE.md'), '\nuser text\n');
    write('review.md', 'second');
    expect((await cli(args)).code).toBe(1);
    const updated = await cli([...args, '--overwrite']);
    expect(updated.code).toBe(0);
    expect(updated.output).toContain('updated');
    const content = fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8');
    expect(content).toContain('second');
    expect(content).toContain('user text');
    expect(content).not.toContain('first');
  });

  it('does not recommend overwrite for a malformed config', async () => {
    write('.mcp.json', '{bad');
    write('tool.json', '{"command":"node"}');
    const result = await cli(['--mcp', './tool.json', '--host', 'claude-code', '--overwrite']);
    expect(result.code).toBe(1);
    expect(result.output).toContain('Failed to parse');
    expect(result.output).not.toContain('re-run the same command with --overwrite');
    expect(fs.readFileSync(path.join(root, '.mcp.json'), 'utf8')).toBe('{bad');
  });

  it('documents overwrite in help', async () => {
    expect((await cli(['--help'])).output).toContain('--overwrite');
  });
});
