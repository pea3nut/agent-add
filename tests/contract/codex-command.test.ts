import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import yaml from 'yaml';
import { splitFrontmatter } from '../../src/utils/frontmatter.js';

const execFileAsync = promisify(execFile);
const binPath = path.resolve(__dirname, '../../bin/agent-add.js');
const command = path.resolve(__dirname, '../fixtures/command/scenario-exec.md');
const skill = path.resolve(__dirname, '../fixtures/skill/my-skill');
const subAgent = path.resolve(__dirname, '../fixtures/sub-agent/scenario-case-runner.md');

describe('Codex commands installed as Skills (real subprocess)', () => {
  let root: string;
  let project: string;
  let home: string;
  let temporary: string;
  let env: NodeJS.ProcessEnv;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-add-command-contract-'));
    project = path.join(root, 'project');
    home = path.join(root, 'home');
    temporary = path.join(root, 'tmp');
    for (const directory of [project, home, temporary]) fs.mkdirSync(directory);
    env = { ...process.env, HOME: home, USERPROFILE: home, AGENT_ADD_HOME: home,
      TMPDIR: temporary, TMP: temporary, TEMP: temporary };
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  const cli = (args: string[]) => execFileAsync(process.execPath, [binPath, '--host', 'codex', ...args], { cwd: project, env });
  const target = () => path.join(project, '.agents/skills/scenario-exec');

  it('installs Skill, Command and Sub-agent together and keeps conversion visible', async () => {
    const args = ['--skill', skill, '--command', command, '--sub-agent', subAgent];
    const installed = await cli(args);

    expect(installed.stdout).toContain('3 written');
    expect(installed.stdout).toContain('Converted to skill; invoke with $scenario-exec');
    const content = fs.readFileSync(path.join(target(), 'SKILL.md'), 'utf8');
    expect(splitFrontmatter(content).metadata.name).toBe('scenario-exec');
    expect(content).toContain(fs.readFileSync(command, 'utf8'));
    expect(yaml.parse(fs.readFileSync(path.join(target(), 'agents/openai.yaml'), 'utf8')))
      .toEqual({ policy: { allow_implicit_invocation: false } });
    expect(fs.existsSync(path.join(project, '.agents/skills/my-skill/SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(project, '.codex/agents/scenario-case-runner.toml'))).toBe(true);
    expect(fs.existsSync(path.join(project, '.codex/commands'))).toBe(false);
    expect(fs.readdirSync(temporary)).toEqual([]);

    expect((await cli(args)).stdout).toContain('3 exists');
    expect((await cli([...args, '--overwrite'])).stdout).toContain('3 overwritten');
    expect(fs.readFileSync(path.join(target(), 'SKILL.md'), 'utf8')).toBe(content);
    expect(fs.readdirSync(temporary)).toEqual([]);
  });

  it('converts commands supplied through a Pack', async () => {
    const manifest = path.join(project, 'manifest.json');
    fs.writeFileSync(manifest, JSON.stringify({ name: 'test/scenario-test', assets: [
      { type: 'skill', source: skill }, { type: 'command', source: command }, { type: 'subAgent', source: subAgent },
    ] }));

    expect((await cli(['--pack', manifest])).stdout).toContain('3 written');
    expect(fs.existsSync(path.join(target(), 'SKILL.md'))).toBe(true);
  });

  it('uses the user Skill root with --global, independently of CODEX_HOME', async () => {
    env.CODEX_HOME = path.join(root, 'custom-codex');

    const result = await cli(['--global', '--command', command]);

    expect(result.stdout).toContain('1 written');
    expect(fs.existsSync(path.join(home, '.agents/skills/scenario-exec/SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(home, '.agents/skills/scenario-exec/agents/openai.yaml'))).toBe(true);
    expect(fs.existsSync(env.CODEX_HOME)).toBe(false);
    expect(fs.readdirSync(project)).toEqual([]);
  });

  it('blocks the entire batch when command metadata cannot be converted', async () => {
    const invalid = path.join(project, 'invalid.md');
    fs.writeFileSync(invalid, '---\nallowed-tools: Bash\n---\nRun tests.\n');

    await expect(cli(['--skill', skill, '--command', command, '--command', invalid, '--overwrite']))
      .rejects.toMatchObject({ code: 1, stdout: expect.stringContaining('cannot represent field allowed-tools') });

    expect(fs.existsSync(path.join(project, '.agents'))).toBe(false);
    expect(fs.readdirSync(temporary)).toEqual([]);
  });

  it('checks same-name native and converted Skills before writes, and supports explicit replacement', async () => {
    const native = path.join(project, 'scenario-exec');
    fs.mkdirSync(native);
    fs.writeFileSync(path.join(native, 'SKILL.md'), '---\nname: scenario-exec\ndescription: Original\n---\nOriginal instructions.\n');
    fs.writeFileSync(path.join(native, 'helper.txt'), 'original helper');
    const args = ['--skill', native, '--command', command];

    await expect(cli(args)).rejects.toMatchObject({
      code: 1, stdout: expect.stringContaining('Different sources share the same asset name'),
    });
    expect(fs.existsSync(path.join(project, '.agents'))).toBe(false);

    expect((await cli([...args, '--overwrite'])).stdout).toContain('1 overwritten');
    expect(fs.readFileSync(path.join(target(), 'SKILL.md'), 'utf8')).toContain('Execute Gherkin test cases');
    expect(fs.existsSync(path.join(target(), 'helper.txt'))).toBe(false);
    expect(fs.readdirSync(temporary)).toEqual([]);
  });

  it('protects a changed installed bundle until --overwrite replaces it completely', async () => {
    await cli(['--command', command]);
    const entry = path.join(target(), 'SKILL.md');
    fs.writeFileSync(entry, 'Local instructions.\n');
    fs.writeFileSync(path.join(target(), 'local.txt'), 'local resource');

    expect((await cli(['--command', command])).stdout).toContain('1 skipped');
    expect(fs.readFileSync(entry, 'utf8')).toBe('Local instructions.\n');
    expect((await cli(['--command', command, '--overwrite'])).stdout).toContain('1 overwritten');
    expect(fs.readFileSync(entry, 'utf8')).toContain('Execute Gherkin test cases');
    expect(fs.existsSync(path.join(target(), 'local.txt'))).toBe(false);
  });

  it('supports directory globs through the same conversion', async () => {
    const commands = path.join(project, 'commands');
    fs.mkdirSync(commands);
    fs.writeFileSync(path.join(commands, 'review.md'), '# Review\n\nReview the changes.\n');

    const result = await cli(['--command', commands + '/*']);

    expect(result.stdout).toContain('Converted to skill; invoke with $review');
    expect(fs.existsSync(path.join(project, '.agents/skills/commands/review/SKILL.md'))).toBe(true);
  });
});
