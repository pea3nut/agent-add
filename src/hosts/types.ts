export type AssetType = 'mcp' | 'skill' | 'prompt' | 'command' | 'subAgent';

export interface AssetCapability {
  supported: boolean;
  reason?: string;
  configFile?: string | Record<string, string>;
  configKey?: string;
  installDir?: string;
  entryFile?: string;
  fileExtension?: string;
  pattern?: string;
  targetFile?: string;
  writeStrategy?: 'append-with-marker' | 'inject-json-key' | 'copy-file';
  markerFormat?: string;
}

export interface HostDetection {
  paths: string[] | Record<string, string>;
}

export interface HostConfig {
  id: string;
  displayName: string;
  docs: string;
  detection: HostDetection;
  assets: Record<AssetType, AssetCapability>;
}
