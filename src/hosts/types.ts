export type AssetType = 'mcp' | 'skill' | 'prompt' | 'command' | 'subAgent';
export type InstallScope = 'project' | 'user';

export type WriteStrategy =
  | 'append-with-marker'
  | 'inject-json-key'
  | 'copy-file'
  | 'create-file-in-dir';

export interface AssetCapability {
  supported: boolean;
  reason?: string;
  configFile?: string;
  configKey?: string;
  configFormat?: 'json' | 'jsonc';
  configFileAlternatives?: string[];
  registration?: 'instructions' | 'read';
  installDir?: string;
  entryFile?: string;
  fileExtension?: string;
  pattern?: string;
  targetFile?: string;
  writeStrategy?: WriteStrategy;
  markerFormat?: string;
}

export interface HostDetection {
  paths: string[];
}

export interface HostAdapter {
  readonly id: string;
  readonly displayName: string;
  readonly detection: HostDetection;
  readonly assets: Record<AssetType, AssetCapability>;
  readonly scope?: InstallScope;
  readonly rootDir?: string;
}

/** @deprecated Use HostAdapter */
export type HostConfig = HostAdapter;
