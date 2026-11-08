import fs from 'fs';
import path from 'path';
import { applyEdits, format as formatJson, modify, parse, visit, type ParseError, type JSONPath } from 'jsonc-parser';
import { ensureDir } from './fs.js';
import { deepEqualIgnoringKeyOrder } from './deep-equal.js';
import { compare, unescapePathComponent } from 'fast-json-patch';

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
  const original = parseConfig(content, format);
  const expected = parseConfig(content, format);
  let parent = expected;
  for (const key of keyPath.slice(0, -1)) {
    if (!Object.hasOwn(parent, key)) parent[key] = {};
    if (!isRecord(parent[key])) throw new Error('Configuration parent must be an object');
    parent = parent[key];
  }
  Object.defineProperty(parent, keyPath[keyPath.length - 1]!, { value, enumerable: true, writable: true, configurable: true });
  let result = content;
  for (const operation of compare(original, expected)) {
    const path: JSONPath = [];
    let parent: unknown = parseConfig(result, format);
    for (const component of operation.path.split('/').slice(1)) {
      const key = unescapePathComponent(component);
      const segment = Array.isArray(parent) ? (key === '-' ? parent.length : Number(key)) : key;
      path.push(segment);
      parent = parent !== null && typeof parent === 'object' && Object.hasOwn(parent, segment)
        ? (parent as Record<string | number, unknown>)[segment] : undefined;
    }
    if (operation.op !== 'add' && operation.op !== 'replace' && operation.op !== 'remove')
      throw new Error('Unsupported configuration change');
    // The library's last-array-item removal needs whitespace before the closing
    // bracket. Its formatter provides that without regenerating unrelated values.
    if (operation.op === 'remove' && typeof path[path.length - 1] === 'number')
      result = applyEdits(result, formatJson(result, undefined, { insertSpaces: true, tabSize: 2 }));
    result = applyEdits(result, modify(result, path, operation.op === 'remove' ? undefined : operation.value, {}));
  }
  if (!deepEqualIgnoringKeyOrder(parseConfig(result, format), expected))
    throw new Error('Configuration edit did not preserve the planned value');
  return result;
}
