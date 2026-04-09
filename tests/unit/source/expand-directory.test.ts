import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { expandDirectory } from '../../../src/source/expand-directory.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'expand-dir-test-'));
});

afterEach(async () => {
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe('expandDirectory', () => {
  describe('command / prompt / subAgent (*.md)', () => {
    it('should return all .md files in top-level directory', async () => {
      await fs.promises.writeFile(path.join(tmpDir, 'cmd-a.md'), '# A');
      await fs.promises.writeFile(path.join(tmpDir, 'cmd-b.md'), '# B');

      const result = await expandDirectory(tmpDir, 'command');
      const names = result.map(r => r.assetName).sort();
      expect(names).toEqual(['cmd-a', 'cmd-b']);
    });

    it('should ignore non-.md files', async () => {
      await fs.promises.writeFile(path.join(tmpDir, 'cmd-a.md'), '# A');
      await fs.promises.writeFile(path.join(tmpDir, 'config.json'), '{}');
      await fs.promises.writeFile(path.join(tmpDir, 'README.txt'), 'hello');

      const result = await expandDirectory(tmpDir, 'command');
      expect(result).toHaveLength(1);
      expect(result[0].assetName).toBe('cmd-a');
    });

    it('should ignore subdirectories', async () => {
      await fs.promises.writeFile(path.join(tmpDir, 'cmd-a.md'), '# A');
      await fs.promises.mkdir(path.join(tmpDir, 'subdir'));
      await fs.promises.writeFile(path.join(tmpDir, 'subdir', 'nested.md'), '# nested');

      const result = await expandDirectory(tmpDir, 'command');
      expect(result).toHaveLength(1);
      expect(result[0].assetName).toBe('cmd-a');
    });

    it('should return empty array for empty directory', async () => {
      const result = await expandDirectory(tmpDir, 'command');
      expect(result).toEqual([]);
    });

    it('should work for prompt type too', async () => {
      await fs.promises.writeFile(path.join(tmpDir, 'p1.md'), '# P1');
      await fs.promises.writeFile(path.join(tmpDir, 'p2.md'), '# P2');

      const result = await expandDirectory(tmpDir, 'prompt');
      expect(result).toHaveLength(2);
    });

    it('should work for subAgent type too', async () => {
      await fs.promises.writeFile(path.join(tmpDir, 'agent.md'), '# Agent');

      const result = await expandDirectory(tmpDir, 'subAgent');
      expect(result).toHaveLength(1);
      expect(result[0].assetName).toBe('agent');
    });
  });

  describe('mcp (*.json)', () => {
    it('should return all .json files', async () => {
      await fs.promises.writeFile(path.join(tmpDir, 'svc-a.json'), '{}');
      await fs.promises.writeFile(path.join(tmpDir, 'svc-b.json'), '{}');

      const result = await expandDirectory(tmpDir, 'mcp');
      const names = result.map(r => r.assetName).sort();
      expect(names).toEqual(['svc-a', 'svc-b']);
    });

    it('should ignore non-.json files', async () => {
      await fs.promises.writeFile(path.join(tmpDir, 'svc.json'), '{}');
      await fs.promises.writeFile(path.join(tmpDir, 'readme.md'), '# hi');

      const result = await expandDirectory(tmpDir, 'mcp');
      expect(result).toHaveLength(1);
      expect(result[0].assetName).toBe('svc');
    });
  });

  describe('skill (subdirs with SKILL.md)', () => {
    it('should return subdirectories containing SKILL.md', async () => {
      const skillA = path.join(tmpDir, 'skill-a');
      const skillB = path.join(tmpDir, 'skill-b');
      const notSkill = path.join(tmpDir, 'not-skill');
      await fs.promises.mkdir(skillA);
      await fs.promises.mkdir(skillB);
      await fs.promises.mkdir(notSkill);
      await fs.promises.writeFile(path.join(skillA, 'SKILL.md'), '# Skill A');
      await fs.promises.writeFile(path.join(skillB, 'SKILL.md'), '# Skill B');
      await fs.promises.writeFile(path.join(notSkill, 'README.md'), '# Not a skill');

      const result = await expandDirectory(tmpDir, 'skill');
      const names = result.map(r => r.assetName).sort();
      expect(names).toEqual(['skill-a', 'skill-b']);
    });

    it('should return empty array when no subdirs have SKILL.md', async () => {
      await fs.promises.mkdir(path.join(tmpDir, 'empty-dir'));

      const result = await expandDirectory(tmpDir, 'skill');
      expect(result).toEqual([]);
    });
  });

  describe('localPath correctness', () => {
    it('should return full absolute paths', async () => {
      await fs.promises.writeFile(path.join(tmpDir, 'test.md'), '# Test');

      const result = await expandDirectory(tmpDir, 'command');
      expect(path.isAbsolute(result[0].localPath)).toBe(true);
      expect(result[0].localPath).toBe(path.join(tmpDir, 'test.md'));
    });
  });
});
