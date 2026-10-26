import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { readJSONOrNull } from '../../../src/utils/fs.js';

describe('readJSONOrNull', () => {
  it('returns null when the file does not exist', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-test-'));
    const result = await readJSONOrNull(path.join(tmpDir, 'missing.json'));
    expect(result).toBeNull();
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns the parsed object for valid JSON', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-test-'));
    const filePath = path.join(tmpDir, 'valid.json');
    await fs.promises.writeFile(filePath, JSON.stringify({ key: 'value' }));
    const result = await readJSONOrNull(filePath);
    expect(result).toEqual({ key: 'value' });
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  it('throws (does not silently return null) for a file with malformed JSON (regression)', async () => {
    // Regression: previously any error (including a JSON.parse failure on an
    // existing-but-malformed file) was swallowed and treated the same as a
    // missing file, which let callers default to {} and silently overwrite/
    // destroy the malformed file's actual content.
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'agent-add-test-'));
    const filePath = path.join(tmpDir, 'malformed.json');
    await fs.promises.writeFile(filePath, '{"mcpServers":{"existing-tool":{"command":"echo"},}}');
    await expect(readJSONOrNull(filePath)).rejects.toThrow();
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });
});
