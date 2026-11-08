import { describe, expect, it } from 'vitest';
import { parseConfig, setConfigValue } from '../../../src/utils/config.js';

describe('library-backed configuration edits', () => {
  it('returns identical source including comments, escapes and CRLF when no data changes', () => {
    const source = '{\r\n "target": {"text":"\\u0061", /* note */ "args":[ 1, 2, ]},\r\n "other":true\r\n}';
    expect(setConfigValue(source, ['target'], { text: 'a', args: [1, 2] }, 'jsonc')).toBe(source);
  });

  it('edits nested leaves without replacing their surrounding commented object', () => {
    const source = '{ /* root */ "target": { /* entry */ "args":["old" /* argument */], "env":{"KEEP":"same", /* env */ "UPDATE":"old"}}, "other": 9007199254740993}';
    const desired = { args: ['new'], env: { KEEP: 'same', UPDATE: 'new' } };
    const text = setConfigValue(source, ['target'], desired, 'jsonc');
    expect(parseConfig(text, 'jsonc').target).toEqual(desired);
    for (const note of ['/* root */', '/* entry */', '/* argument */', '/* env */']) expect(text).toContain(note);
    expect(text).toContain('"other": 9007199254740993');
  });

  it('retains an existing registration member and its comment when appending', () => {
    const source = '{"paths":["\\u0061.md" /* keep */], "theme":  "user"}';
    const text = setConfigValue(source, ['paths'], ['a.md', 'new.md'], 'jsonc');
    expect(parseConfig(text, 'jsonc')).toEqual({ paths: ['a.md', 'new.md'], theme: 'user' });
    expect(text).toContain('"\\u0061.md"');
    expect(text).toContain('/* keep */');
    expect(text).toContain('"theme":  "user"');
  });

  it.each([
    { before: [1, 2, 3], after: [4] },
    { before: [], after: [1, 2] },
    { before: [1], after: [] },
    { before: [{ old: true }], after: [{ fresh: true }, 2] },
  ])('applies array additions/removals in JSON Patch order: $before -> $after', ({ before, after }) => {
    const text = setConfigValue(JSON.stringify({ target: before, other: true }), ['target'], after, 'json');
    expect(JSON.parse(text)).toEqual({ target: after, other: true });
  });

  it.each([
    '["keep","old" /* removed */]',
    '["keep","old" // removed\r\n]',
    '[ /* retained */ "keep","old"]',
  ])('removes a final commented array item without corrupting compact JSONC: %s', (array) => {
    const source = '{"target":' + array + ',"other":9007199254740993}';
    const text = setConfigValue(source, ['target'], ['keep'], 'jsonc');
    expect(parseConfig(text, 'jsonc').target).toEqual(['keep']);
    expect(text).toContain('9007199254740993');
    if (source.includes('/* retained */')) expect(text).toContain('/* retained */');
  });

  it('distinguishes escaped pointer components and numeric object keys from array indices', () => {
    const source = '{"target":{"a~/b":{"0":"old"},"list":[{"x/y":1}]},"other":true}';
    const desired = { 'a~/b': { '0': 'new' }, list: [{ 'x/y': 2 }, 3] };
    expect(JSON.parse(setConfigValue(source, ['target'], desired, 'json'))).toEqual({ target: desired, other: true });
  });

  it('creates a missing parent without replacing unrelated values', () => {
    const text = setConfigValue('{ "other": 1 }', ['nested', 'target'], { value: 'new' }, 'json');
    expect(JSON.parse(text)).toEqual({ other: 1, nested: { target: { value: 'new' } } });
  });

  it('rejects duplicate keys before invoking the fault-tolerant edit library', () => {
    expect(() => setConfigValue('{"target":1,"target":2}', ['target'], 3, 'json')).toThrow('Duplicate configuration key');
  });

  it('rejects a value that cannot be encoded without changing its meaning', () => {
    expect(() => setConfigValue('{"target":1}', ['target'], Number.NaN, 'json')).toThrow('planned value');
  });
});
