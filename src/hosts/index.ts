import { HostId, type HostAdapter } from './types.js';
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
import { ZedAdapter } from './zed.js';
import { ClineAdapter } from './cline.js';
import { ContinueAdapter } from './continue.js';
import { AiderAdapter } from './aider.js';
import { GooseAdapter } from './goose.js';
import { AmpAdapter } from './amp.js';

const hostRegistry: Map<HostId, HostAdapter> = new Map<HostId, HostAdapter>([
  [HostId.Cursor, new CursorAdapter()],
  [HostId.ClaudeCode, new ClaudeCodeAdapter()],
  [HostId.ClaudeDesktop, new ClaudeDesktopAdapter()],
  [HostId.Windsurf, new WindsurfAdapter()],
  [HostId.GitHubCopilot, new GitHubCopilotAdapter()],
  [HostId.Gemini, new GeminiAdapter()],
  [HostId.RooCode, new RooCodeAdapter()],
  [HostId.KiloCode, new KiloCodeAdapter()],
  [HostId.QwenCode, new QwenCodeAdapter()],
  [HostId.OpenCode, new OpencodeAdapter()],
  [HostId.Augment, new AugmentAdapter()],
  [HostId.Kiro, new KiroAdapter()],
  [HostId.Tabnine, new TabnineAdapter()],
  [HostId.Kimi, new KimiAdapter()],
  [HostId.Trae, new TraeAdapter()],
  [HostId.OpenClaw, new OpenclawAdapter()],
  [HostId.Codex, new CodexAdapter()],
  [HostId.Vibe, new VibeAdapter()],
  [HostId.Zed, new ZedAdapter()],
  [HostId.Cline, new ClineAdapter()],
  [HostId.Continue, new ContinueAdapter()],
  [HostId.Aider, new AiderAdapter()],
  [HostId.Goose, new GooseAdapter()],
  [HostId.Amp, new AmpAdapter()],
]);

export function getHost(id: string): HostAdapter | undefined {
  const hostId = Object.values(HostId).find((value) => value === id);
  return hostId === undefined ? undefined : hostRegistry.get(hostId);
}

export function getAllHosts(): HostAdapter[] {
  return Array.from(hostRegistry.values());
}

export function getValidHostIds(): HostId[] {
  return Array.from(hostRegistry.keys());
}

export function registerHost(adapter: HostAdapter): void {
  hostRegistry.set(adapter.id, adapter);
}
