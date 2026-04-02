import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { atomicWriteJSON } from '../../../src/utils/fs.js';

describe('atomicWriteJSON', () => {
  it('should write valid JSON to target path', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-test-'));
    const targetFile = path.join(tmpDir, 'test.json');

    await atomicWriteJSON(targetFile, { key: 'value' });

    const content = JSON.parse(await fs.promises.readFile(targetFile, 'utf-8'));
    expect(content).toEqual({ key: 'value' });

    await fs.promises.rm(tmpDir, { recursive: true });
  });

  it('should create parent directories if they do not exist', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-test-'));
    const targetFile = path.join(tmpDir, 'sub', 'dir', 'test.json');

    await atomicWriteJSON(targetFile, { nested: true });

    const content = JSON.parse(await fs.promises.readFile(targetFile, 'utf-8'));
    expect(content).toEqual({ nested: true });

    await fs.promises.rm(tmpDir, { recursive: true });
  });

  it('should not leave temp files behind after successful write', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-test-'));
    const targetFile = path.join(tmpDir, 'test.json');

    await atomicWriteJSON(targetFile, { clean: true });

    const files = await fs.promises.readdir(tmpDir);
    expect(files).toEqual(['test.json']);

    await fs.promises.rm(tmpDir, { recursive: true });
  });

  it('should use target directory for temp file to avoid cross-device rename (EXDEV)', async () => {
    // Regression test: atomicWriteJSON must create the temp file in the same
    // directory as the target file. Using os.tmpdir() causes EXDEV errors on
    // Windows when the target is on a different drive (e.g. C: vs E:).
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-test-'));
    const targetFile = path.join(tmpDir, 'test.json');

    // Spy on fs.promises.writeFile to capture the temp file path
    const originalWriteFile = fs.promises.writeFile;
    let tempFilePath: string | undefined;
    fs.promises.writeFile = async function (filePath: any, ...args: any[]) {
      if (typeof filePath === 'string' && filePath.endsWith('.tmp')) {
        tempFilePath = filePath;
      }
      return (originalWriteFile as any).call(this, filePath, ...args);
    } as any;

    try {
      await atomicWriteJSON(targetFile, { exdev: 'test' });

      expect(tempFilePath).toBeDefined();
      // Temp file must be in the same directory as the target
      expect(path.dirname(tempFilePath!)).toBe(tmpDir);
    } finally {
      fs.promises.writeFile = originalWriteFile;
      await fs.promises.rm(tmpDir, { recursive: true });
    }
  });
});
