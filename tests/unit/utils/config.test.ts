import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  atomicWriteText,
  parseConfig,
  setConfigValue,
} from '../../../src/utils/config.js';

describe('JSON5 targeted edits', () => {
  it.each([
    '{ // keep comment\n unquoted: true, special: Infinity, }',
    '{unquoted: true, special: Infinity /* keep comment */,}',
    '{/* keep comment */ unquoted: true, special: Infinity}',
    '{unquoted: true, special: Infinity, mcp: {/* keep comment */ servers:{}}}',
  ])('inserts nested keys without normalizing existing JSON5', (source) => {
    const output = setConfigValue(
      source,
      ['mcp', 'servers', 'demo'],
      { command: 'echo' },
      'json5',
    );
    expect(parseConfig(output, 'json5')).toEqual({
      unquoted: true,
      special: Infinity,
      mcp: { servers: { demo: { command: 'echo' } } },
    });
    expect(output).toContain('keep comment');
    expect(output).toContain('special: Infinity');
  });

  it('updates a quoted leaf without touching comments, strings or sibling values', () => {
    const source =
      '{"mcp":{"servers":{"demo":{"command":"old"}, keep:{command:"same"}}}, note:"/* comma, */", /* keep comment */}';
    const output = setConfigValue(
      source,
      ['mcp', 'servers', 'demo'],
      { command: 'new' },
      'json5',
    );
    expect(parseConfig(output, 'json5')).toEqual({
      mcp: { servers: { demo: { command: 'new' }, keep: { command: 'same' } } },
      note: '/* comma, */',
    });
    expect(output).toContain('/* keep comment */');
  });

  it('treats prototype-looking keys as data', () => {
    const output = setConfigValue(
      '{}',
      ['servers', '__proto__'],
      { command: 'echo' },
      'json5',
    );
    expect(
      Object.hasOwn(
        parseConfig(output, 'json5').servers as object,
        '__proto__',
      ),
    ).toBe(true);
    expect(({} as Record<string, unknown>).command).toBeUndefined();
  });

  it.each(['{', '{a:1 b:2}', '[]', 'null'])(
    'refuses malformed or non-object documents',
    (source) => {
      expect(() => setConfigValue(source, ['mcp'], {}, 'json5')).toThrow();
    },
  );
});

describe('YAML sequence edits', () => {
  it.each([
    'read: EXISTING.md # keep inline\n',
    'read:\n  - EXISTING.md # keep inline\n',
  ])(
    'preserves scalar/list item comments when adding registration',
    (source) => {
      const output = setConfigValue(
        '# keep header\n' + source + 'model: chosen\n',
        ['read'],
        ['EXISTING.md', 'CONVENTIONS.md'],
        'yaml',
      );
      expect(parseConfig(output, 'yaml')).toEqual({
        read: ['EXISTING.md', 'CONVENTIONS.md'],
        model: 'chosen',
      });
      expect(output).toContain('# keep header');
      expect(output).toContain('# keep inline');
    },
  );
});

describe('atomic writes', () => {
  it.skipIf(process.platform === 'win32')(
    'uses private new files and retains existing permissions',
    async () => {
      const directory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'agent-add-config-'),
      );
      const file = path.join(directory, 'config.json');
      try {
        await atomicWriteText(file, 'first');
        expect((await fs.stat(file)).mode & 0o777).toBe(0o600);
        await fs.chmod(file, 0o660);
        await atomicWriteText(file, 'second');
        expect((await fs.stat(file)).mode & 0o777).toBe(0o660);
        expect(await fs.readFile(file, 'utf8')).toBe('second');
        expect(await fs.readdir(directory)).toEqual(['config.json']);
      } finally {
        await fs.rm(directory, { recursive: true, force: true });
      }
    },
  );
});
