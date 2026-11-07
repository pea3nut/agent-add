import { describe, it, expect } from 'vitest';
import { formatSummary } from '../../../src/utils/summary.js';
import type { InstallSummary } from '../../../src/utils/summary.js';
import { HostId, type HostConfig } from '../../../src/hosts/types.js';
import type { InstallJob, InstallResult } from '../../../src/assets/types.js';

const mockHost: HostConfig = {
  id: HostId.Cursor,
  displayName: 'Cursor',
  detection: { paths: ['.cursor'] },
  assets: {
    mcp: { supported: true },
    skill: { supported: true },
    prompt: { supported: true },
    command: { supported: true },
    subAgent: { supported: true },
  },
};

function makeJob(assetType: InstallJob['assetType'], assetName: string): InstallJob {
  return {
    assetType,
    assetName,
    resolvedSource: { type: 'local', localPath: '/tmp/file', originalSource: './file' },
    host: mockHost,
  };
}

function makeResult(
  assetType: InstallJob['assetType'],
  assetName: string,
  status: InstallResult['status'],
  extras?: Partial<InstallResult>,
): InstallResult {
  return { job: makeJob(assetType, assetName), status, ...extras };
}

describe('formatSummary', () => {
  it('should include the header line', () => {
    const summary: InstallSummary = {
      host: mockHost,
      results: [makeResult('mcp', 'playwright', 'written')],
    };
    expect(formatSummary(summary)).toContain('agent-add — Install Summary');
  });

  it('should include the host display name', () => {
    const summary: InstallSummary = {
      host: mockHost,
      results: [makeResult('mcp', 'playwright', 'written')],
    };
    expect(formatSummary(summary)).toContain('Host: Cursor');
  });

  it('should show ✓ written for written status', () => {
    const summary: InstallSummary = {
      host: mockHost,
      results: [makeResult('mcp', 'playwright', 'written', { targetPath: '/a/b' })],
    };
    expect(formatSummary(summary)).toContain('✓ written');
  });

  it('shows overwritten separately from written', () => {
    const output = formatSummary({ host: mockHost, results: [makeResult('mcp', 'tool', 'overwritten')] });
    expect(output).toContain('↻ overwritten');
    expect(output).toContain('0 written · 1 overwritten · 0 errors');
  });

  it('does not advertise legacy skip exists or conflict statuses', () => {
    const output = formatSummary({ host: mockHost, results: [makeResult('mcp', 'tool', 'written')] });
    for (const legacy of ['skipped', 'exists', 'conflict']) expect(output).not.toContain(legacy);
  });

  it('reports actionable error reasons', () => {
    const output = formatSummary({ host: mockHost, results: [makeResult('mcp', 'tool', 'error', { reason: 'Permission denied' })] });
    expect(output).toContain('✗ error');
    expect(output).toContain('Permission denied');
    expect(output).toContain('0 written · 0 overwritten · 1 errors');
  });

  it('should truncate long assetName to 22 characters', () => {
    const longName = 'a-very-long-asset-name-exceeding-limit';
    const summary: InstallSummary = {
      host: mockHost,
      results: [makeResult('mcp', longName, 'written')],
    };
    const output = formatSummary(summary);
    const label = `mcp/${longName}`;
    expect(output).not.toContain(label);
    expect(output).toContain('…');
  });

  it('counts only actual result categories', () => {
    const output = formatSummary({ host: mockHost, results: [
      makeResult('mcp', 'new', 'written'), makeResult('skill', 'old', 'overwritten'),
      makeResult('prompt', 'bad', 'error'),
    ] });
    expect(output).toContain('1 written · 1 overwritten · 1 errors');
  });
});
