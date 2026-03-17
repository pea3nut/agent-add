import hostsDataRaw from '../hosts.json';
import type { HostConfig } from './types.js';

const hostsData = hostsDataRaw as { hosts: HostConfig[] };

const hostRegistry: Map<string, HostConfig> = new Map();

for (const host of hostsData.hosts) {
  hostRegistry.set(host.id, host);
}

export function getHost(id: string): HostConfig | undefined {
  return hostRegistry.get(id);
}

export function getAllHosts(): HostConfig[] {
  return Array.from(hostRegistry.values());
}

export function getValidHostIds(): string[] {
  return Array.from(hostRegistry.keys());
}
