import path from 'path';
import type { AssetCapability, UserEnvironment } from './types.js';

export const unsupported = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});
export const skill = (installDir: string): AssetCapability => ({
  supported: true,
  installDir,
  entryFile: 'SKILL.md',
  writeStrategy: 'copy-file',
});
export const file = (installDir: string, fileExtension = '.md'): AssetCapability => ({
  supported: true,
  installDir,
  fileExtension,
  writeStrategy: 'copy-file',
});
export const prompt = (targetFile: string): AssetCapability => ({
  supported: true,
  targetFile,
  writeStrategy: 'append-with-marker',
});
export const rules = (installDir: string): AssetCapability => ({
  supported: true,
  installDir,
  writeStrategy: 'create-file-in-dir',
});
export const mcp = (
  configFile: string,
  configKey = 'mcpServers',
  jsonc = false,
): AssetCapability => ({
  supported: true,
  configFile,
  configKey,
  configFormat: jsonc ? 'jsonc' : 'json',
  writeStrategy: 'inject-json-key',
});

export function userPaths({ home, env }: UserEnvironment) {
  const at = (...parts: string[]) => path.join(home, ...parts);
  const override = (name: string, fallback: string): string => {
    const value = env[name];
    if (!value) return fallback;
    if (!path.isAbsolute(value))
      throw new Error(name + ' must be an absolute path for user installation');
    return path.normalize(value);
  };
  const custom = (names: string[]) => names.find((name) => env[name]);
  const reject = (name: string) => unsupported(
    'User installation with ' + name +
    ' is not supported; no default destination was used.',
  );
  return { at, override, custom, reject };
}
