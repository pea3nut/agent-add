import type { InstallStatus } from '../assets/types.js';
import type { HostConfig } from '../hosts/types.js';
import type { InstallResult } from '../assets/types.js';

export interface InstallSummary {
  host: HostConfig;
  results: InstallResult[];
}

const symbols: Record<InstallStatus, string> = {
  written: '✓ written', overwritten: '↻ overwritten', error: '✗ error',
};

export function formatSummary({ host, results }: InstallSummary): string {
  const lines = ['agent-add — Install Summary', `Host: ${host.displayName}`,
    `Scope: ${host.scope === 'user' ? 'user (--global)' : 'project'}`, ''];
  for (const result of results) {
    const label = `${result.job.assetType}/${result.job.assetName}`;
    const short = label.length > 22 ? label.slice(0, 21) + '…' : label;
    lines.push(`  ${symbols[result.status].padEnd(15)} ${short}${result.targetPath ? ' → ' + result.targetPath : ''}`);
    if (result.reason) lines.push('    ! error: ' + label + ' — ' + result.reason);
  }
  const count = (status: InstallStatus) => results.filter((result) => result.status === status).length;
  lines.push('', `${count('written')} written · ${count('overwritten')} overwritten · ${count('error')} errors`);
  return lines.join('\n');
}

export function printSummary(summary: InstallSummary): void {
  console.log(formatSummary(summary));
}
