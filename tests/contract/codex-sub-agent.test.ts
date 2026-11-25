import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { parse } from 'smol-toml';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const binPath = path.resolve(__dirname, '../../bin/agent-add.js');
const agentSource = path.resolve(__dirname, '../fixtures/sub-agent/scenario-case-runner.md');
const skillSource = path.resolve(__dirname, '../fixtures/skill/my-skill');

describe('Codex skill and portable sub-agent batch (real subprocess)', () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-add-contract-codex-'));
  });

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  const args = (source = agentSource) => [
    '--host', 'codex', '--skill', skillSource, '--sub-agent', source,
  ];

  it('installs the whole batch, then supports identical and forced reinstalls', async () => {
    const agentTarget = path.join(projectDir, '.codex/agents/scenario-case-runner.toml');
    const skillTarget = path.join(projectDir, '.agents/skills/my-skill/SKILL.md');
    const installed = await execFileAsync(process.execPath, [binPath, ...args(), '--overwrite'], { cwd: projectDir });

    expect(installed.stdout).toContain('2 written');
    expect(fs.readFileSync(skillTarget, 'utf8')).toBe(fs.readFileSync(path.join(skillSource, 'SKILL.md'), 'utf8'));
    const content = fs.readFileSync(agentTarget, 'utf8');
    const agent = parse(content);
    expect(agent.name).toBe('scenario-case-runner');
    expect(agent).not.toHaveProperty('model');
    expect(agent).not.toHaveProperty('readonly');
    expect(agent.developer_instructions).toContain('Do not create, edit, delete, or otherwise modify files.');

    const repeated = await execFileAsync(process.execPath, [binPath, ...args()], { cwd: projectDir });
    expect(repeated.stdout).toContain('2 exists');
    expect(fs.readFileSync(agentTarget, 'utf8')).toBe(content);

    const overwritten = await execFileAsync(process.execPath, [binPath, ...args(), '--overwrite'], { cwd: projectDir });
    expect(overwritten.stdout).toContain('2 overwritten');
    expect(fs.readFileSync(agentTarget, 'utf8')).toBe(content);
  });

  it('rejects malformed readonly before writing either asset, even with --overwrite', async () => {
    const invalidSource = path.join(projectDir, 'invalid.md');
    fs.writeFileSync(invalidSource, fs.readFileSync(agentSource, 'utf8').replace('readonly: true', 'readonly: "true"'));

    await expect(execFileAsync(process.execPath, [binPath, ...args(invalidSource), '--overwrite'], { cwd: projectDir }))
      .rejects.toMatchObject({ code: 1, stdout: expect.stringContaining('Codex sub-agent readonly must be a boolean') });

    expect(fs.existsSync(path.join(projectDir, '.agents'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.codex'))).toBe(false);
  });
});
