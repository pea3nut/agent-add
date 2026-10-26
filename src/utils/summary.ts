import type { InstallResult, InstallStatus } from '../assets/types.js';
import type { HostConfig } from '../hosts/types.js';
import { describeSource } from './redact.js';

export interface InstallSummary {
  host: HostConfig;
  results: InstallResult[];
  dryRun?: boolean;
}

const STATUS_SYMBOLS: Record<InstallStatus, string> = {
  written: '✓ written',
  exists: '≡ exists',
  updated: '↑ updated',
  skipped: '─ skipped',
  conflict: '✗ conflict',
  error: '✗ error',
};

const DRY_RUN_SYMBOLS: Record<InstallStatus, string> = {
  written: 'would-write',
  updated: 'would-update',
  exists: 'would-skip',
  skipped: 'would-skip',
  conflict: 'would-conflict',
  error: 'error',
};

function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + '…';
}

export function formatSummary(summary: InstallSummary): string {
  const { host, results, dryRun = false } = summary;
  const symbols = dryRun ? DRY_RUN_SYMBOLS : STATUS_SYMBOLS;
  const lines: string[] = [];

  lines.push(dryRun ? 'agent-add — Dry-run Plan (no target files changed)' : 'agent-add — Install Summary');
  lines.push(`Host: ${host.displayName}`);
  lines.push('');

  const nonSkipped = results.filter((r) => r.status !== 'skipped');
  const skipped = results.filter((r) => r.status === 'skipped');

  for (const result of nonSkipped) {
    const symbol = symbols[result.status];
    const assetLabel = truncate(`${result.job.assetType}/${result.job.assetName}`, 22);
    const targetInfo = result.targetPath ? ` → ${result.targetPath}` : '';
    const sourceInfo = dryRun
      ? ` (from ${describeSource(result.job.resolvedSource.originalSource)}${result.status === 'exists' ? '; identical content' : ''})`
      : result.status === 'updated' ? ` (overwritten from ${describeSource(result.job.resolvedSource.originalSource)})` : '';
    lines.push(`  ${symbol.padEnd(12)} ${assetLabel}${targetInfo}${sourceInfo}`);
  }

  if (skipped.length > 0) {
    for (const result of skipped) {
      const assetLabel = truncate(`${result.job.assetType}/${result.job.assetName}`, 22);
      const targetInfo = dryRun && result.targetPath ? ` → ${result.targetPath}` : '';
      const reason = result.reason ? ` (${result.reason})` : '';
      if (dryRun) lines.push(`  ${symbols.skipped.padEnd(12)} ${assetLabel}${targetInfo}${reason}`);
      else lines.push(`  ─ skipped   ${assetLabel}${reason}`);
    }
  } else {
    lines.push(dryRun ? `  ${symbols.skipped.padEnd(12)} (none)` : '  ─ skipped   (none)');
  }

  const conflicts = results.filter((r) => r.status === 'conflict');
  if (conflicts.length === 0) {
    lines.push(dryRun ? `  ${symbols.conflict.padEnd(12)} (none)` : '  ✗ conflict  (none)');
  }

  lines.push('');

  const writtenCount = results.filter((r) => r.status === 'written' || r.status === 'updated' || r.status === 'exists').length;
  const skippedCount = skipped.length;
  const conflictCount = conflicts.length;
  if (dryRun) {
    const writes = results.filter((r) => r.status === 'written').length;
    const updates = results.filter((r) => r.status === 'updated').length;
    const unchanged = results.filter((r) => r.status === 'exists').length;
    const errors = results.filter((r) => r.status === 'error').length;
    lines.push(`${writes} would-write · ${updates} would-update · ${skippedCount + unchanged} would-skip · ${conflictCount} would-conflict · ${errors} errors`);
  } else {
    lines.push(`${writtenCount} written · ${skippedCount} skipped · ${conflictCount} conflicts`);
  }

  if (conflicts.length > 0) {
    lines.push('');
    lines.push('  Preflight failed. No target files were changed.');
  }
  for (const result of conflicts) {
    lines.push('');
    lines.push(`  ! conflict: ${result.job.assetType}/${result.job.assetName} — ${result.reason ?? 'target exists with user modifications'}`);
    lines.push(`              Source: ${describeSource(result.job.resolvedSource.originalSource)}`);
    if (result.canOverwrite !== false) {
      lines.push('              To overwrite conflicting assets, re-run the same command with --overwrite.');
      lines.push(`              Example: agent-add --pack ./manifest.json --host ${host.id} --overwrite${dryRun ? ' --dry-run' : ''}`);
    }
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
