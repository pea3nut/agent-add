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

export interface McpServerInput {
  source: Record<string, unknown>;
  command: unknown;
  args: unknown;
  env: unknown;
  url: unknown;
  transport: unknown;
  nativeHttp: boolean;
}

export type McpConfigEdit =
  | { status: 'written' | 'overwritten'; content: string }
  | { status: 'exists' | 'conflict'; reason?: string };

export interface McpAdapter {
  validateSource?: (source: Record<string, unknown>) => void;
  normalizeUrl?: (url: string) => string;
  editConfig?: (
    current: string | null,
    file: string,
    name: string,
    server: Record<string, unknown>,
    overwrite?: boolean,
  ) => McpConfigEdit;
  convert: (input: McpServerInput, name: string) => Record<string, unknown>;
}

export interface SubAgentContent {
  metadata: Record<string, unknown>;
  body: string;
}

export interface HostAdapter {
  readonly id: HostId;
  readonly displayName: string;
  readonly detection: HostDetection;
  readonly selectionPriority?: number;
  readonly assets: Record<AssetType, AssetCapability>;
  readonly userAssets?: (environment: UserEnvironment) => UserAssets;
  readonly mcp?: McpAdapter;
  readonly serializeSubAgent?: (content: SubAgentContent, name: string) => string;
  readonly serializeCommand?: (content: string) => string;
  readonly registerPrompt?: (
    host: HostAdapter,
    target: string,
  ) => Promise<{ file: string; content: string } | null>;
  readonly resolvePromptTarget?: (host: HostAdapter) => Promise<string>;
  readonly scope?: InstallScope;
  readonly rootDir?: string;
}

/** @deprecated Use HostAdapter */
export type HostConfig = HostAdapter;
