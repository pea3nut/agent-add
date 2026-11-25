import { describe, expect, it } from 'vitest';
import yaml from 'yaml';
import { getHost } from '../../../src/hosts/index.js';
import { splitFrontmatter } from '../../../src/utils/frontmatter.js';

const codex = getHost('codex')!;

describe('Codex command-to-Skill conversion', () => {
  it('wraps a plain command as a Skill that requires explicit invocation', () => {
    const original = '# /scenario-exec\n\nExecute Gherkin test cases.\n';
    const result = codex.commandToSkill!(original, 'scenario-exec');
    const { metadata, body } = splitFrontmatter(result.files['SKILL.md']!);

    expect(metadata.name).toBe('scenario-exec');
    expect(metadata.description).toContain('scenario-exec');
    expect(body).toContain(original);
    expect(body).toContain('$scenario-exec');
    expect(body).toContain('command arguments');
    expect(result.invocation).toBe('$scenario-exec');
    expect(yaml.parse(result.files['agents/openai.yaml']!)).toEqual({
      policy: { allow_implicit_invocation: false },
    });
  });

  it('keeps descriptions, argument hints and argument placeholders', () => {
    const result = codex.commandToSkill!(
      '---\ndescription: Run selected cases\nargument-hint: cases=<path>\n---\nRun $ARGUMENTS and inspect $1.\n',
      'scenario-exec',
    );
    const { metadata, body } = splitFrontmatter(result.files['SKILL.md']!);

    expect(metadata.description).toBe('Run selected cases');
    expect(body).toContain('Argument hint: cases=<path>');
    expect(body).toContain('Run $ARGUMENTS and inspect $1.');
    expect(body).toContain('interpret them from that user-supplied text');
  });

  it('applies matching host hints before validating metadata', () => {
    const result = codex.commandToSkill!(
      '---\ndescription: Generic\nagent-add/codex/description: Codex workflow\nagent-add/cursor/model: auto\n---\nRun the tests.\n',
      'scenario-exec',
    );
    const { metadata } = splitFrontmatter(result.files['SKILL.md']!);

    expect(metadata).toEqual({ name: 'scenario-exec', description: 'Codex workflow' });
    expect(result.files['SKILL.md']).not.toContain('agent-add/');
  });

  it('uses the leaf name for a command installed from a directory glob', () => {
    const result = codex.commandToSkill!('# Review\n', 'commands/review');

    expect(splitFrontmatter(result.files['SKILL.md']!).metadata.name).toBe('review');
    expect(result.invocation).toBe('$review');
  });

  it.each(['model', 'allowed-tools', 'hooks'])('rejects metadata that cannot be represented: %s', (field) => {
    expect(() => codex.commandToSkill!('---\n' + field + ': value\n---\nRun tests.\n', 'demo'))
      .toThrow('Codex command-to-Skill conversion cannot represent field ' + field);
  });

  it.each(['description: false', 'description: ""', 'argument-hint: 1'])('rejects invalid metadata: %s', (metadata) => {
    expect(() => codex.commandToSkill!('---\n' + metadata + '\n---\nRun tests.\n', 'demo'))
      .toThrow('must be a nonempty string');
  });

  it('rejects empty instructions', () => {
    expect(() => codex.commandToSkill!('---\ndescription: Test\n---\n\n', 'demo'))
      .toThrow('Codex command instructions must be nonempty');
  });

  it('keeps the native name and description within Codex limits', () => {
    expect(() => codex.commandToSkill!('# Test\n', 'x'.repeat(65))).toThrow('at most 64 characters');
    expect(() => codex.commandToSkill!('---\ndescription: ' + 'x'.repeat(1025) + '\n---\nRun tests.\n', 'demo'))
      .toThrow('at most 1024 characters');
  });

  it('leaves native command handling on other hosts intact', () => {
    expect(getHost('cursor')!.commandToSkill).toBeUndefined();
    expect(getHost('gemini')!.commandToSkill).toBeUndefined();
  });
});
