import { describe, expect, it } from 'vitest';
import { parse } from 'smol-toml';
import yaml from 'yaml';
import { parseConfig, setConfigValue } from '../../../src/utils/config.js';
import { setTomlValue } from '../../../src/utils/toml-edit.js';
import { updateYamlProperty } from '../../../src/utils/yaml-edit.js';

describe('source-preserving TOML edits', () => {
  it('retains scalar spelling, comments, CRLF and a missing final newline', () => {
    const source = "# user\r\n[target]\r\ntext = 'literal' # note\r\nnumber = 1_000\r\narray = [ 'a', 'b', ]";
    expect(setTomlValue(source, ['target'], { text: 'literal', number: 1000, array: ['a', 'b'] })).toBe(source);
  });

  it.each([
    '[target]\nvalue = "old"\n',
    'target.value = "old"\n',
    'target = { value = "old" }\n',
    '[target]\nchild.value = "old"\n',
    'target = { child.value = "old" }\n',
  ])('edits parsed keys and implied inline parents: %s', (source) => {
    const nested = source.includes('child');
    const desired = nested ? { child: { value: 'new', extra: true } } : { value: 'new', extra: true };
    const text = setTomlValue(source, ['target'], desired);
    expect(parse(text)).toEqual({ target: desired });
  });

  it('does not interpret dotted quoted names or fake headers inside multiline strings', () => {
    const prefix = 'note = """\n[target."a.b"]\nvalue = "fake"\n"""\n';
    const source = prefix + '[target."a.b"]\nvalue = "old" # keep\n';
    const text = setTomlValue(source, ['target', 'a.b'], { value: 'new' });
    expect(text).toBe(prefix + '[target."a.b"]\nvalue = "new" # keep\n');
  });

  it.each(['[\n  "a", # one\n  "b", # two\n]', '["a", "b"]'])('removes array items while retaining comments: %s', (array) => {
    const source = 'target = ' + array + '\n';
    const shorter = setTomlValue(source, ['target'], ['a']);
    expect(parse(shorter)).toEqual({ target: ['a'] });
    const empty = setTomlValue(shorter, ['target'], []);
    expect(parse(empty)).toEqual({ target: [] });
    const extended = setTomlValue(empty, ['target'], ['c', 'd']);
    expect(parse(extended)).toEqual({ target: ['c', 'd'] });
    if (array.includes('#')) expect(extended).toContain('# two');
  });

  it('removes nested tables without erasing their comments or an unrelated table', () => {
    const suffix = '[other]\ntext = \'literal\' # untouched\n';
    const source = '# head\n[target]\n# target note\na = "old"\n[target.child]\n# child note\nvalue = 1\n' + suffix;
    const text = setTomlValue(source, ['target'], { fresh: true });
    expect(parse(text)).toEqual({ target: { fresh: true }, other: { text: 'literal' } });
    expect(text).toContain('# target note');
    expect(text).toContain('# child note');
    expect(text.endsWith(suffix)).toBe(true);
  });

  it('removes a named array table and its children, preserving comments and other entries', () => {
    const source = '# user\n[[items]]\nname="one"\n[[items]]\n# duplicate note\nname="two"\n[items.env]\n# env note\nA="b"\n[[items]]\nname=\'three\' # exact\n';
    const text = setTomlValue(source, ['items', 1], undefined);
    expect(parse(text)).toEqual({ items: [{ name: 'one' }, { name: 'three' }] });
    expect(text).toContain('# duplicate note');
    expect(text).toContain('# env note');
    expect(text).toContain("name='three' # exact");
  });

  it('changes a table to a scalar without rebuilding the document', () => {
    const source = '# note\n[target]\nold = 1\n[other]\nkeep = true\n';
    const text = setTomlValue(source, ['target'], 'new');
    expect(parse(text)).toEqual({ target: 'new', other: { keep: true } });
    expect(text).toContain('# note');
    expect(text).toContain('[other]\nkeep = true\n');
  });

  it('retains multiline inline-table comments when editing TOML 1.1', () => {
    const source = 'target = {\n  old = "gone", # inline note\n  keep = \'same\',\n}\n';
    const text = setTomlValue(source, ['target'], { keep: 'same', added: true });
    expect(parse(text)).toEqual({ target: { keep: 'same', added: true } });
    expect(text).toContain('# inline note');
    expect(text).toContain("keep = 'same'");
  });

  it('distinguishes TOML datetime scalars from tables during a type change', () => {
    const text = setTomlValue('target = 2024-01-01T00:00:00Z # keep\n', ['target'], { safe: true });
    expect(parse(text)).toEqual({ target: { safe: true } });
    expect(text).toContain('# keep');
  });
});

describe('source-preserving JSON/JSONC edits', () => {
  it('keeps identical escaped scalars and comments byte-for-byte', () => {
    const source = '{\r\n "target": {"text":"\\u0061", /* inside */ "args":[ 1, 2, ]},\r\n "other":true\r\n}';
    expect(setConfigValue(source, ['target'], { text: 'a', args: [1, 2] }, 'jsonc')).toBe(source);
  });

  it('patches nested members and retains comments for removed properties and array items', () => {
    const suffix = '"other": [ 1,  2 ] /* outside */}';
    const source = '{"target": { /* entry */ "old":1, // obsolete\n "args":["a", // argument\n "b",], "env":{"A":"old"}}, ' + suffix;
    const desired = { args: ['a'], env: { A: 'new', B: 'more' }, fresh: true };
    const text = setConfigValue(source, ['target'], desired, 'jsonc');
    expect(parseConfig(text, 'jsonc')).toEqual({ target: desired, other: [1, 2] });
    for (const note of ['/* entry */', '// obsolete', '// argument', '/* outside */']) expect(text).toContain(note);
    expect(text.endsWith(suffix)).toBe(true);
  });

  it('appends a registration array member without regenerating existing members', () => {
    const source = '{"paths":["\\u0061.md" /* keep */], "theme":  "user"}';
    const text = setConfigValue(source, ['paths'], ['a.md', 'new.md'], 'jsonc');
    expect(parseConfig(text, 'jsonc')).toEqual({ paths: ['a.md', 'new.md'], theme: 'user' });
    expect(text).toContain('"\\u0061.md" /* keep */');
    expect(text).toContain('"theme":  "user"');
  });

  it('retains internal comments when a value changes type', () => {
    const text = setConfigValue('{"target": { // note\n "old": 1}, "other":true}', ['target'], false, 'jsonc');
    expect(parseConfig(text, 'jsonc')).toEqual({ target: false, other: true });
    expect(text).toContain('// note');
  });

  it('creates a missing path using valid strict JSON', () => {
    const text = setConfigValue('{ "other": 1 }', ['nested', 'target'], { value: 'new' }, 'json');
    expect(JSON.parse(text)).toEqual({ other: 1, nested: { target: { value: 'new' } } });
  });
});

describe('source-preserving YAML property edits', () => {
  function append(source: string) {
    const document = yaml.parseDocument(source);
    const node = document.get('paths', true);
    if (yaml.isSeq(node)) node.add('new.md');
    else {
      const sequence = document.createNode(['old.md', 'new.md']);
      if (yaml.isScalar(node) && node.value === 'old.md') sequence.items[0] = node;
      else if (yaml.isNode(node)) { sequence.comment = node.comment; sequence.commentBefore = node.commentBefore; }
      document.set('paths', sequence);
    }
    return updateYamlProperty(source, document, 'paths');
  }

  it('retains unrelated spelling, comments, indentation and CRLF', () => {
    const prefix = '# user\r\nmodel:  \'quoted\' # keep\r\n';
    const suffix = '# footer\r\nother:\r\n    keep:  [ 1,  2 ]\r\n';
    const text = append(prefix + "paths:\r\n    - 'old.md' # path note\r\n" + suffix);
    expect(yaml.parse(text)).toEqual({ model: 'quoted', paths: ['old.md', 'new.md'], other: { keep: [1, 2] } });
    expect(text.startsWith(prefix)).toBe(true);
    expect(text.endsWith(suffix)).toBe(true);
    expect(text).toContain("'old.md' # path note");
  });

  it.each(['paths: old.md # keep\nother:  true\n', 'paths: # keep\nother: true\n', 'defaults: &shared [old.md]\npaths: *shared # keep\n', '    paths: [old.md]\n    other: true\n', '    other: true\n', '{other: true, paths: [old.md]}\n', '{}\n', '{other: true,}\n', '{other:}\n', '# comment only\n', '---\nother: true\n...\n'])('changes only the property for YAML forms: %s', (source) => {
    const text = append(source);
    expect(yaml.parse(text).paths).toEqual(['old.md', 'new.md']);
    if (source.includes('# keep')) expect(text).toContain('# keep');
    if (source.includes('# comment')) expect(text).toContain('# comment only');
    if (source.includes('...')) expect(text.endsWith('...\n')).toBe(true);
  });

  it('refuses an alias side effect that changes an unrelated value', () => {
    expect(() => append('paths: &shared [old.md]\nother: *shared\n')).toThrow('planned configuration');
  });
});
