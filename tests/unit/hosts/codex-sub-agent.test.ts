import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'smol-toml';
import { describe, expect, it } from 'vitest';
import yaml from 'yaml';
import { getHost } from '../../../src/hosts/index.js';
import { formatSubAgent } from '../../../src/hosts/sub-agent.js';

const fixture = fs.readFileSync(
  path.resolve(__dirname, '../../fixtures/sub-agent/scenario-case-runner.md'),
  'utf8',
);
const codex = getHost('codex')!;

function source(metadata: Record<string, unknown>, body = 'Review the code.') {
  return `---\n${yaml.stringify({ description: 'Code reviewer', ...metadata })}---\n${body}`;
}

describe('Codex sub-agent portable metadata', () => {
  it('converts scenario-case-runner metadata into instructions without a model override', () => {
    // Regression: pea3nut/scenario-test uses readonly and model: inherit together.
    const result = parse(formatSubAgent(codex, fixture, 'scenario-case-runner'));

    expect(result.name).toBe('scenario-case-runner');
    expect(result.description).toBe('Executes test steps and reports results as plain text.');
    expect(result.developer_instructions).toContain('Follow the test instruction packet');
    expect(result.developer_instructions).toContain('Do not read or write external files.');
    expect(result.developer_instructions).toContain('Do not create, edit, delete, or otherwise modify files.');
    expect(result).not.toHaveProperty('model');
    expect(result).not.toHaveProperty('readonly');
    // Custom agents inherit the parent's sandbox; a per-agent setting cannot enforce this.
    expect(result).not.toHaveProperty('sandbox_mode');
    expect(Object.keys(result).some((key) => key.startsWith('agent-add/'))).toBe(false);
  });

  it.each([{}, { readonly: false }])('preserves instructions when no read-only constraint is requested: %j', (metadata) => {
    const result = parse(formatSubAgent(codex, source(metadata), 'reviewer'));

    expect(result.developer_instructions).toBe('Review the code.');
    expect(result).not.toHaveProperty('readonly');
    expect(result).not.toHaveProperty('sandbox_mode');
  });

  it('retains explicit developer instructions and adds the read-only constraint', () => {
    const result = parse(formatSubAgent(codex, source({
      readonly: true,
      developer_instructions: 'Inspect changes and report findings.',
    }), 'reviewer'));

    expect(result.developer_instructions).toMatch(/^Inspect changes and report findings\.\n\n/);
    expect(result.developer_instructions).toContain('Do not create, edit, delete, or otherwise modify files.');
  });

  it('preserves an explicitly selected model', () => {
    const result = parse(formatSubAgent(codex, source({ model: 'gpt-6-luna' }), 'reviewer'));

    expect(result.model).toBe('gpt-6-luna');
  });

  it('omits model: inherit even without readonly metadata', () => {
    const result = parse(formatSubAgent(codex, source({ model: 'inherit' }), 'reviewer'));

    expect(result).not.toHaveProperty('model');
    expect(result.developer_instructions).toBe('Review the code.');
  });

  it('applies Codex hints before converting portable metadata', () => {
    const result = parse(formatSubAgent(codex, source({
      model: 'inherit',
      readonly: true,
      'agent-add/codex/model': 'gpt-6-luna',
      'agent-add/codex/readonly': false,
    }), 'reviewer'));

    expect(result.model).toBe('gpt-6-luna');
    expect(result.developer_instructions).toBe('Review the code.');
    expect(result).not.toHaveProperty('readonly');
  });

  it('supports opting into inheritance and read-only instructions through Codex hints', () => {
    const result = parse(formatSubAgent(codex, source({
      model: 'haiku',
      'agent-add/codex/model': 'inherit',
      'agent-add/codex/readonly': true,
    }), 'reviewer'));

    expect(result).not.toHaveProperty('model');
    expect(result.developer_instructions).toContain('Do not create, edit, delete, or otherwise modify files.');
  });

  it.each([null, 'true', 'false', 1, [], {}].map((readonly) => ({ readonly })))('rejects invalid readonly values: $readonly', ({ readonly }) => {
    expect(() => formatSubAgent(codex, source({ readonly }), 'reviewer'))
      .toThrow('Codex sub-agent readonly must be a boolean');
  });

  it('still rejects unknown metadata', () => {
    expect(() => formatSubAgent(codex, source({ readonly: true, unknown: true }), 'reviewer'))
      .toThrow('Codex sub-agent cannot represent field unknown');
  });

  it('still requires nonempty instructions when readonly is true', () => {
    expect(() => formatSubAgent(codex, source({ readonly: true }, ''), 'reviewer'))
      .toThrow('Codex requires nonempty developer_instructions');
  });

  it('keeps other hosts\' native metadata intact', () => {
    const result = formatSubAgent(getHost('cursor')!, fixture, 'scenario-case-runner');

    expect(result).toContain('model: auto');
    expect(result).toContain('readonly: true');
    expect(result).not.toContain('agent-add/');
  });
});
