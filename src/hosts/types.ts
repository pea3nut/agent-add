export enum HostId {
  Aider = 'aider',
  Amp = 'amp',
  Augment = 'augment',
  ClaudeCode = 'claude-code',
  ClaudeDesktop = 'claude-desktop',
  Cline = 'cline',
  Codex = 'codex',
  Continue = 'continue',
  Cursor = 'cursor',
  Gemini = 'gemini',
  GitHubCopilot = 'github-copilot',
  Goose = 'goose',
  KiloCode = 'kilo-code',
  Kimi = 'kimi',
  Kiro = 'kiro',
  OpenClaw = 'openclaw',
  OpenCode = 'opencode',
  QwenCode = 'qwen-code',
  RooCode = 'roo-code',
  Tabnine = 'tabnine',
  Trae = 'trae',
  Vibe = 'vibe',
  Windsurf = 'windsurf',
  Zed = 'zed',
}

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

export interface UserEnvironment {
  home: string;
  env: NodeJS.ProcessEnv;
  platform: NodeJS.Platform;
}

export type UserAssets = Partial<Record<AssetType, AssetCapability>>;

export interface HostAdapter {
  readonly id: HostId;
  readonly displayName: string;
  readonly detection: HostDetection;
  readonly assets: Record<AssetType, AssetCapability>;
  readonly userAssets?: (environment: UserEnvironment) => UserAssets;
  readonly scope?: InstallScope;
  readonly rootDir?: string;
}

/** @deprecated Use HostAdapter */
export type HostConfig = HostAdapter;
