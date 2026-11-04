import fs from 'fs';
import path from 'path';
import { applyEdits, modify, parse, visit, type ParseError } from 'jsonc-parser';
import { ensureDir } from './fs.js';
import { deepEqualIgnoringKeyOrder } from './deep-equal.js';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export type ConfigFormat = 'json' | 'jsonc';

export async function resolveConfigPath(capability: {
  configFile?: string;
  configFileAlternatives?: string[];
}): Promise<string> {
  const files = [capability.configFile!, ...(capability.configFileAlternatives ?? [])];
  for (const file of files)
    if ((await readTextOrNull(file)) !== null) return path.resolve(file);
  return path.resolve(files[0]!);
}

export function parseConfig(content: string, format: ConfigFormat): Record<string, unknown> {
  const errors: ParseError[] = [];
  const options = { allowTrailingComma: format === 'jsonc', disallowComments: format === 'json' };
  const value: unknown = parse(content, errors, options);
  if (errors.length || !isRecord(value)) throw new Error('Invalid object configuration');
  const objects: Set<string>[] = [];
  visit(content, {
    onObjectBegin: () => { objects.push(new Set()); },
    onObjectProperty: (key) => {
      const keys = objects[objects.length - 1]!;
      if (keys.has(key)) throw new Error('Duplicate configuration key: ' + JSON.stringify(key));
      keys.add(key);
    },
    onObjectEnd: () => { objects.pop(); },
  }, options);
  return value;
}

export async function readTextOrNull(file: string): Promise<string | null> {
  try {
    return await fs.promises.readFile(file, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

export async function atomicWriteText(
  file: string,
  content: string,
): Promise<void> {
  const link = await fs.promises
    .lstat(file)
    .catch((err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') return undefined;
      throw err;
    });
  if (link?.isSymbolicLink()) file = await fs.promises.realpath(file);
  await ensureDir(path.dirname(file));
  const existing = await fs.promises
    .stat(file)
    .catch((err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') return undefined;
      throw err;
    });
  const temporary = path.join(
    path.dirname(file),
    `.agent-add-${process.pid}-${Math.random().toString(36).slice(2)}.tmp`,
  );
  try {
    await fs.promises.writeFile(temporary, content, {
      encoding: 'utf-8',
      flag: 'wx',
      mode: existing ? existing.mode & 0o777 : 0o600,
    });
    if (existing) await fs.promises.chmod(temporary, existing.mode & 0o777);
    await fs.promises.rename(temporary, file);
  } finally {
    await fs.promises.rm(temporary, { force: true });
  }
}

export function assertSafeConfigKey(key: string): void {
  if (
    !key.trim() ||
    ['__proto__', 'constructor', 'prototype', '<<'].includes(key)
  )
    throw new Error('Unsafe configuration key: ' + JSON.stringify(key));
}

export function setConfigValue(
  content: string,
  keyPath: string[],
  value: unknown,
  format: ConfigFormat,
): string {
  keyPath.forEach(assertSafeConfigKey);
  if (!keyPath.length) throw new Error('Configuration key path must not be empty');
  parseConfig(content, format);
  const result = applyEdits(content, modify(content, keyPath, value, {
    formattingOptions: { insertSpaces: true, tabSize: 2, eol: content.includes('\r\n') ? '\r\n' : '\n' },
  }));
  let actual: unknown = parseConfig(result, format);
  for (const key of keyPath)
    actual =
      isRecord(actual) && Object.hasOwn(actual, key) ? actual[key] : undefined;
  if (!deepEqualIgnoringKeyOrder(actual, value))
    throw new Error('Configuration edit did not preserve the planned value');
  return result;
}
