import type { AssetType, HostConfig } from '../hosts/types.js';

export type InstallStatus = 'written' | 'exists' | 'updated' | 'skipped' | 'conflict' | 'error';

export interface ResolvedSource {
  type: 'local' | 'git-ssh' | 'git-https' | 'http-file';
  localPath: string;
  originalSource: string;
  tempDir?: string;
}

export interface InstallJob {
  assetType: AssetType;
  assetName: string;
  resolvedSource: ResolvedSource;
  host: HostConfig;
}

export interface InstallResult {
  job: InstallJob;
  status: InstallStatus;
  targetPath?: string;
  reason?: string;
}

export interface AssetHandler {
  handle(job: InstallJob): Promise<InstallResult>;
}
