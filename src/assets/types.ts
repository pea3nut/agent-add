import type { AssetType, HostConfig } from '../hosts/types.js';

export type InstallStatus = 'written' | 'exists' | 'updated' | 'skipped' | 'conflict' | 'error';

export interface ResolvedSource {
  type: 'local' | 'git-ssh' | 'git-https' | 'http-file' | 'inline-json' | 'inline-md';
  localPath: string;
  originalSource: string;
  tempDir?: string;
}

export interface InstallJob {
  assetType: AssetType;
  assetName: string;
  resolvedSource: ResolvedSource;
  host: HostConfig;
  cwd?: string;
  overwrite?: boolean;
}

export interface InstallResult {
  job: InstallJob;
  status: InstallStatus;
  targetPath?: string;
  reason?: string;
  canOverwrite?: boolean;
}

export interface PreparedAsset {
  job: InstallJob;
  targetPath: string;
  kind: 'file' | 'prompt' | 'mcp-json' | 'mcp-table' | 'mcp-array' | 'skill';
  content?: string;
  entry?: Record<string, unknown>;
  configKey?: string;
  files?: Map<string, Buffer | null>;
  modes?: Map<string, number>;
}

export interface AssetHandler {
  prepare(job: InstallJob): Promise<PreparedAsset>;
  handle(job: InstallJob): Promise<InstallResult>;
}
