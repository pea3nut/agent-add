import fs from 'fs';
import path from 'path';
import os from 'os';
import { getAllHosts } from '../hosts/index.js';
import type { HostConfig, HostDetection } from '../hosts/types.js';

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

export function detectHosts(cwd: string): HostConfig[] {
  const allHosts = getAllHosts();
  const detected: HostConfig[] = [];
  const notDetected: HostConfig[] = [];

  let dir = cwd;
  const visited = new Set<string>();

  while (!visited.has(dir)) {
    visited.add(dir);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  const searchDirs = Array.from(visited);

  for (const host of allHosts) {
    let found = false;

    if (Array.isArray(host.detection.paths)) {
      for (const searchDir of searchDirs) {
        for (const detPath of host.detection.paths as string[]) {
          if (pathExistsSync(path.resolve(searchDir, detPath))) {
            found = true;
            break;
          }
        }
        if (found) break;
      }
    } else {
      const paths = getDetectionPaths(host.detection, cwd);
      for (const p of paths) {
        if (pathExistsSync(p)) {
          found = true;
          break;
        }
      }
    }

    if (found) {
      detected.push(host);
    } else {
      notDetected.push(host);
    }
  }

  return [...detected, ...notDetected];
}
