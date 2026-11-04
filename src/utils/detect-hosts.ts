import { HostId } from '../hosts/types.js';
import fs from 'fs';
import path from 'path';
import { getAllHosts } from '../hosts/index.js';
import type { HostConfig } from '../hosts/types.js';

const MAX_WALK_DEPTH = 3;

function pathExistsSync(p: string): boolean {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function buildSearchDirs(cwd: string): string[] {
  let dir = cwd;
  const visited = new Set<string>();
  let depth = 0;

  while (!visited.has(dir) && depth < MAX_WALK_DEPTH) {
    visited.add(dir);
    depth++;
    // Stop at git repo boundary — don't cross into parent repos
    if (pathExistsSync(path.join(dir, '.git'))) break;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return Array.from(visited);
}

function checkHostDetection(host: HostConfig, searchDirs: string[]): boolean {
  return searchDirs.some((dir) =>
    host.detection.paths.some((p) => pathExistsSync(path.resolve(dir, p))),
  );
}

export function isHostDetected(host: HostConfig, cwd: string): boolean {
  return checkHostDetection(host, buildSearchDirs(cwd));
}

const POPULARITY_ORDER: HostId[] = [
  HostId.Cursor,
  HostId.ClaudeCode,
  HostId.Trae,
  HostId.QwenCode,
  HostId.GitHubCopilot,
  HostId.Codex,
  HostId.Windsurf,
  HostId.Gemini,
  HostId.Kimi,
  HostId.Augment,
  HostId.RooCode,
  HostId.Kiro,
  HostId.Tabnine,
  HostId.KiloCode,
  HostId.OpenCode,
  HostId.OpenClaw,
  HostId.Vibe,
  HostId.ClaudeDesktop,
];

function sortByPopularity(hosts: HostConfig[]): HostConfig[] {
  return hosts.slice().sort((a, b) => {
    const ai = POPULARITY_ORDER.indexOf(a.id);
    const bi = POPULARITY_ORDER.indexOf(b.id);
    return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
  });
}

export function detectHosts(cwd: string): HostConfig[] {
  const allHosts = getAllHosts();
  const searchDirs = buildSearchDirs(cwd);
  const detected: HostConfig[] = [];
  const notDetected: HostConfig[] = [];

  for (const host of allHosts) {
    if (checkHostDetection(host, searchDirs)) {
      detected.push(host);
    } else {
      notDetected.push(host);
    }
  }

  return [...sortByPopularity(detected), ...sortByPopularity(notDetected)];
}
