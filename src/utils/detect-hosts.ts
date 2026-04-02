import fs from 'fs';
import path from 'path';
import os from 'os';
import { getAllHosts } from '../hosts/index.js';
import type { HostConfig, HostDetection } from '../hosts/types.js';

const MAX_WALK_DEPTH = 3;

function expandDetectionPath(p: string): string {
  if (p.startsWith('~/')) {
    return path.join(os.homedir(), p.slice(2));
  }
  if (process.platform === 'win32' && p.startsWith('%APPDATA%')) {
    const appData = process.env['APPDATA'] ?? path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, p.slice('%APPDATA%'.length));
  }
  return p;
}

function getDetectionPaths(detection: HostDetection, cwd: string): string[] {
  if (Array.isArray(detection.paths)) {
    return detection.paths.map((p) => path.resolve(cwd, p));
  }
  const platformPaths = detection.paths as Record<string, string>;
  const platform = process.platform as string;
  const rawPath = platformPaths[platform] ?? platformPaths['linux'];
  if (!rawPath) return [];
  return [expandDetectionPath(rawPath)];
}

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
  if (Array.isArray(host.detection.paths)) {
    for (const searchDir of searchDirs) {
      for (const detPath of host.detection.paths as string[]) {
        if (pathExistsSync(path.resolve(searchDir, detPath))) {
          return true;
        }
      }
    }
    return false;
  } else {
    const paths = getDetectionPaths(host.detection, searchDirs[0] ?? '');
    for (const p of paths) {
      if (pathExistsSync(p)) {
        return true;
      }
    }
    return false;
  }
}

export function isHostDetected(host: HostConfig, cwd: string): boolean {
  return checkHostDetection(host, buildSearchDirs(cwd));
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

  return [...detected, ...notDetected];
}
