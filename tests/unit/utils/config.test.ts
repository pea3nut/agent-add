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

  it.each(['{', '{a:1 b:2}', '[]', 'null'])(
    'refuses malformed or non-object documents',
    (source) => {
      expect(() => setConfigValue(source, ['mcp'], {}, 'json5')).toThrow();
    },
  );
});

describe.each(['json', 'jsonc', 'json5', 'yaml'] as const)(
  '%s configuration key safety',
  (format) => {
    it.each(['__proto__', 'constructor', 'prototype', '<<'])(
      'rejects reserved key %s',
      (name) => {
        expect(() =>
          setConfigValue('{}', ['servers', name], { command: 'echo' }, format),
        ).toThrow(/Unsafe configuration key/);
        expect(({} as Record<string, unknown>).command).toBeUndefined();
      },
    );
  },
);

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
    'preserves symlink chains and updates only their referent',
    async () => {
      const directory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'agent-add-config-'),
      );
      try {
        const destination = path.join(directory, 'shared.json');
        const middle = path.join(directory, 'middle.json');
        const link = path.join(directory, 'config.json');
        await fs.writeFile(destination, 'first', { mode: 0o640 });
        await fs.symlink('shared.json', middle);
        await fs.symlink('middle.json', link);
        await atomicWriteText(link, 'second');
        expect(await fs.readFile(destination, 'utf8')).toBe('second');
        expect(await fs.readlink(link)).toBe('middle.json');
        expect(await fs.readlink(middle)).toBe('shared.json');
        expect((await fs.stat(destination)).mode & 0o777).toBe(0o640);
        expect((await fs.readdir(directory)).sort()).toEqual([
          'config.json',
          'middle.json',
          'shared.json',
        ]);
      } finally {
        await fs.rm(directory, { recursive: true, force: true });
      }
    },
  );

  it.skipIf(process.platform === 'win32')(
    'leaves dangling symlinks intact and reports the error',
    async () => {
      const directory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'agent-add-config-'),
      );
      const link = path.join(directory, 'config.json');
      try {
        await fs.symlink('missing.json', link);
        await expect(atomicWriteText(link, 'content')).rejects.toMatchObject({
          code: 'ENOENT',
        });
        expect(await fs.readlink(link)).toBe('missing.json');
        expect(await fs.readdir(directory)).toEqual(['config.json']);
      } finally {
        await fs.rm(directory, { recursive: true, force: true });
      }
    },
  );
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
