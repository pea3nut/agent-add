import type { HostAdapter } from './types.js';
import { CursorAdapter } from './cursor.js';
import { ClaudeCodeAdapter } from './claude-code.js';
import { ClaudeDesktopAdapter } from './claude-desktop.js';
import { WindsurfAdapter } from './windsurf.js';
import { GitHubCopilotAdapter } from './github-copilot.js';
import { GeminiAdapter } from './gemini.js';
import { RooCodeAdapter } from './roo-code.js';
import { KiloCodeAdapter } from './kilo-code.js';
import { QwenCodeAdapter } from './qwen-code.js';
import { OpencodeAdapter } from './opencode.js';
import { AugmentAdapter } from './augment.js';
import { KiroAdapter } from './kiro.js';
import { TabnineAdapter } from './tabnine.js';
import { KimiAdapter } from './kimi.js';
import { TraeAdapter } from './trae.js';
import { OpenclawAdapter } from './openclaw.js';
import { CodexAdapter } from './codex.js';
import { VibeAdapter } from './vibe.js';

const hostRegistry: Map<string, HostAdapter> = new Map<string, HostAdapter>([
  ['cursor', new CursorAdapter()],
  ['claude-code', new ClaudeCodeAdapter()],
  ['claude-desktop', new ClaudeDesktopAdapter()],
  ['windsurf', new WindsurfAdapter()],
  ['github-copilot', new GitHubCopilotAdapter()],
  ['gemini', new GeminiAdapter()],
  ['roo-code', new RooCodeAdapter()],
  ['kilo-code', new KiloCodeAdapter()],
  ['qwen-code', new QwenCodeAdapter()],
  ['opencode', new OpencodeAdapter()],
  ['augment', new AugmentAdapter()],
  ['kiro', new KiroAdapter()],
  ['tabnine', new TabnineAdapter()],
  ['kimi', new KimiAdapter()],
  ['trae', new TraeAdapter()],
  ['openclaw', new OpenclawAdapter()],
  ['codex', new CodexAdapter()],
  ['vibe', new VibeAdapter()],
]);

export function getHost(id: string): HostAdapter | undefined {
  return hostRegistry.get(id);
}

export function getAllHosts(): HostAdapter[] {
  return Array.from(hostRegistry.values());
}

export function getValidHostIds(): string[] {
  return Array.from(hostRegistry.keys());
}

export function registerHost(adapter: HostAdapter): void {
  hostRegistry.set(adapter.id, adapter);
}
