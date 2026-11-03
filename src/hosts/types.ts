export type AssetType = 'mcp' | 'skill' | 'prompt' | 'command' | 'subAgent';

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
  readonly docs: string;
  readonly detection: HostDetection;
  readonly assets: Record<AssetType, AssetCapability>;
}

/** @deprecated Use HostAdapter */
export type HostConfig = HostAdapter;
