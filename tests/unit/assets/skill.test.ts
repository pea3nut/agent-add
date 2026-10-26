import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { skillHandler } from '../../../src/assets/skill.js';
import type { InstallJob } from '../../../src/assets/types.js';
import type { HostConfig } from '../../../src/hosts/types.js';

function makeHost(installDir: string): HostConfig {
  return {
    id: 'test-host',
    displayName: 'Test Host',
    docs: '',
    detection: { paths: [] },
    assets: {
      mcp: { supported: false },
      skill: { supported: true, installDir, entryFile: 'SKILL.md', writeStrategy: 'copy-file' },
      prompt: { supported: false },
      command: { supported: false },
      subAgent: { supported: false },
    },
  } as HostConfig;
}

describe('skillHandler (regression)', () => {
  it('retries an install left incomplete by a previous interrupted run', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-skill-test-'));
    const sourceDir = path.join(tmpDir, 'source-skill');
    await fs.promises.mkdir(sourceDir, { recursive: true });
    await fs.promises.writeFile(path.join(sourceDir, 'SKILL.md'), '# My Skill\n');
    await fs.promises.writeFile(path.join(sourceDir, 'extra.txt'), 'extra content');

    const installRoot = path.join(tmpDir, 'installed');
    // Simulate a previous install interrupted mid-copy: the target directory
    // exists, but SKILL.md was never written into it.
    const targetDir = path.join(installRoot, 'my-skill');
    await fs.promises.mkdir(targetDir, { recursive: true });

    const host = makeHost(installRoot);
    const job: InstallJob = {
      assetType: 'skill',
      assetName: 'my-skill',
      resolvedSource: { type: 'local', localPath: sourceDir, originalSource: sourceDir },
      host,
    };

    const result = await skillHandler.handle(job);
    expect(result.status).toBe('written');

    const installedSkillMd = await fs.promises.readFile(path.join(targetDir, 'SKILL.md'), 'utf-8');
    expect(installedSkillMd).toBe('# My Skill\n');

    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('reports exists when SKILL.md is already present in the target directory', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-skill-test-'));
    const sourceDir = path.join(tmpDir, 'source-skill');
    await fs.promises.mkdir(sourceDir, { recursive: true });
    await fs.promises.writeFile(path.join(sourceDir, 'SKILL.md'), '# My Skill\n');

    const installRoot = path.join(tmpDir, 'installed');
    const targetDir = path.join(installRoot, 'my-skill');
    await fs.promises.mkdir(targetDir, { recursive: true });
    await fs.promises.writeFile(path.join(targetDir, 'SKILL.md'), '# Already installed\n');

    const host = makeHost(installRoot);
    const job: InstallJob = {
      assetType: 'skill',
      assetName: 'my-skill',
      resolvedSource: { type: 'local', localPath: sourceDir, originalSource: sourceDir },
      host,
    };

    const result = await skillHandler.handle(job);
    expect(result.status).toBe('exists');
    const content = await fs.promises.readFile(path.join(targetDir, 'SKILL.md'), 'utf-8');
    expect(content).toBe('# Already installed\n');

    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });
});
