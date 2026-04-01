import { describe, it, expect } from 'vitest';
import { formatSummary } from '../../../src/utils/summary.js';
import type { InstallSummary } from '../../../src/utils/summary.js';
import type { HostConfig } from '../../../src/hosts/types.js';
import type { InstallJob, InstallResult } from '../../../src/assets/types.js';

const mockHost: HostConfig = {
  id: 'cursor',
  displayName: 'Cursor',
  docs: 'https://example.com',
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

  it('should show ↑ updated for updated status', () => {
    const summary: InstallSummary = {
      host: mockHost,
      results: [makeResult('mcp', 'playwright', 'updated')],
    };
    expect(formatSummary(summary)).toContain('↑ updated');
  });

  it('should show ─ skipped (none) when there are no skipped results', () => {
    const summary: InstallSummary = {
      host: mockHost,
      results: [makeResult('mcp', 'playwright', 'written')],
    };
    expect(formatSummary(summary)).toContain('─ skipped   (none)');
  });

  it('should show skipped asset name when a result is skipped', () => {
    const summary: InstallSummary = {
      host: mockHost,
      results: [makeResult('mcp', 'playwright', 'skipped', { reason: 'not supported' })],
    };
    const output = formatSummary(summary);
    expect(output).toContain('mcp/playwright');
    expect(output).toContain('not supported');
  });

  it('should show ✗ conflict (none) when there are no conflicts', () => {
    const summary: InstallSummary = {
      host: mockHost,
      results: [makeResult('mcp', 'playwright', 'written')],
    };
    expect(formatSummary(summary)).toContain('✗ conflict  (none)');
  });

  it('should show conflict details with reason', () => {
    const summary: InstallSummary = {
      host: mockHost,
      results: [
        makeResult('mcp', 'playwright', 'conflict', { reason: 'user has local changes' }),
      ],
    };
    const output = formatSummary(summary);
    expect(output).toContain('✗ conflict');
    expect(output).toContain('user has local changes');
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

  it('should show correct counts in summary line', () => {
    const summary: InstallSummary = {
      host: mockHost,
      results: [
        makeResult('mcp', 'tool-a', 'written'),
        makeResult('mcp', 'tool-b', 'exists'),
        makeResult('skill', 'skill-b', 'skipped'),
        makeResult('prompt', 'prompt-c', 'conflict'),
      ],
    };
    const output = formatSummary(summary);
    // writtenCount = written + updated + exists
    expect(output).toContain('2 written');
    expect(output).toContain('1 skipped');
    expect(output).toContain('1 conflicts');
  });
});
