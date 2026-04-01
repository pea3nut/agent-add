import type { InstallResult, InstallStatus } from '../assets/types.js';
import type { HostConfig } from '../hosts/types.js';

export interface InstallSummary {
  host: HostConfig;
  results: InstallResult[];
}

const STATUS_SYMBOLS: Record<InstallStatus, string> = {
  written: '✓ written',
  exists: '≡ exists',
  updated: '↑ updated',
  skipped: '─ skipped',
  conflict: '✗ conflict',
  error: '✗ error',
};

function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + '…';
}

export function formatSummary(summary: InstallSummary): string {
  const { host, results } = summary;
  const lines: string[] = [];

  lines.push('agent-add — Install Summary');
  lines.push(`Host: ${host.displayName}`);
  lines.push('');

  const nonSkipped = results.filter((r) => r.status !== 'skipped');
  const skipped = results.filter((r) => r.status === 'skipped');

  for (const result of nonSkipped) {
    const symbol = STATUS_SYMBOLS[result.status];
    const assetLabel = truncate(`${result.job.assetType}/${result.job.assetName}`, 22);
    const targetInfo = result.targetPath ? ` → ${result.targetPath}` : '';
    lines.push(`  ${symbol.padEnd(12)} ${assetLabel}${targetInfo}`);
  }

  if (skipped.length > 0) {
    for (const result of skipped) {
      const assetLabel = truncate(`${result.job.assetType}/${result.job.assetName}`, 22);
      const reason = result.reason ? ` (${result.reason})` : '';
      lines.push(`  ─ skipped   ${assetLabel}${reason}`);
    }
  } else {
    lines.push('  ─ skipped   (none)');
  }

  const conflicts = results.filter((r) => r.status === 'conflict');
  if (conflicts.length === 0) {
    lines.push('  ✗ conflict  (none)');
  }

  lines.push('');

  const writtenCount = results.filter((r) => r.status === 'written' || r.status === 'updated' || r.status === 'exists').length;
  const skippedCount = skipped.length;
  const conflictCount = conflicts.length;
  lines.push(`${writtenCount} written · ${skippedCount} skipped · ${conflictCount} conflicts`);

  for (const result of conflicts) {
    lines.push('');
    lines.push(`  ! conflict: ${result.job.assetType}/${result.job.assetName} — ${result.reason ?? 'target exists with user modifications'}`);
    lines.push('              To override, remove the existing entry and re-run.');
  }

  const errors = results.filter((r) => r.status === 'error');
  for (const result of errors) {
    lines.push('');
    lines.push(`  ! error: ${result.job.assetType}/${result.job.assetName} — ${result.reason ?? 'unknown error'}`);
  }

  return lines.join('\n');
}

export function printSummary(summary: InstallSummary): void {
  console.log(formatSummary(summary));
}
