import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parse } from 'smol-toml';

const bin = path.resolve(__dirname, '../../bin/agent-add.js');

describe('Gemini command install (built CLI)', () => {
  let root: string;
  let target: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-add-gemini-command-'));
    target = path.join(root, '.gemini/commands/review.toml');
  });

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  function install(content: string) {
    fs.writeFileSync(path.join(root, 'review.md'), content);
    return spawnSync(process.execPath, [bin, '--command', './review.md', '--host', 'gemini'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, HOME: root, AGENT_ADD_HOME: root },
      timeout: 15000,
    });
  }

  it('writes valid TOML and compares converted content on subsequent installs', () => {
    const body = '# Review\nCheck """quotes""", \\paths and {{args}}.\n';
    const content = `---\ndescription: Review changes\nallowed-tools: [Read]\n---\n${body}`;
    const first = install(content);
    expect(first.status, first.stderr).toBe(0);
    expect(parse(fs.readFileSync(target, 'utf8'))).toEqual({ description: 'Review changes', prompt: body });
    const original = fs.readFileSync(target, 'utf8');
    const repeat = install(content);
    expect(repeat.status, repeat.stderr).toBe(0);
    expect(repeat.stdout).toMatch(/exists\s+command\/review/);
    const conflict = install(content + 'New instructions.\n');
    expect(conflict.status).toBe(1);
    expect(conflict.stdout).toMatch(/conflict\s+command\/review/);
    expect(fs.readFileSync(target, 'utf8')).toBe(original);
  });

  it('converts inline Markdown without frontmatter', () => {
    const content = '# Review\n\nCheck {{args}}.';
    const result = spawnSync(process.execPath, [bin, '--command', content, '--host', 'gemini'], {
      cwd: root, encoding: 'utf8', timeout: 15000,
    });
    expect(result.status, result.stderr).toBe(0);
    expect(parse(fs.readFileSync(target, 'utf8'))).toEqual({ prompt: content });
  });

  it('returns a conversion error without writing invalid TOML', () => {
    const result = install('---\ndescription: [broken YAML\n---\n# Review\n');
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/error\s+command\/review/);
    expect(result.stdout).toContain('Failed to convert command source to TOML');
    expect(fs.existsSync(target)).toBe(false);
  });
});
