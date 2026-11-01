import fs from 'fs';
import os from 'os';
import path from 'path';
import JSON5 from 'json5';
import yaml from 'yaml';
import { parseExpressionAt, type ObjectExpression, type Property } from 'acorn';
import type { AssetCapability } from '../hosts/types.js';
import { applyEdits, modify, parse, type ParseError } from 'jsonc-parser';
import { ensureDir } from './fs.js';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function getHome(): string {
  return process.env['AGENT_ADD_HOME'] ?? os.homedir();
}

export function resolveHostPath(raw: string, cwd = process.cwd()): string {
  if (
    !process.env.AGENT_ADD_HOME &&
    process.platform === 'linux' &&
    raw.startsWith('~/.config/')
  ) {
    const configHome =
      (raw.startsWith('~/.config/zed/')
        ? process.env.FLATPAK_XDG_CONFIG_HOME
        : undefined) ?? process.env.XDG_CONFIG_HOME;
    if (configHome)
      return path.resolve(configHome, raw.slice('~/.config/'.length));
  }
  if (raw.startsWith('~/.codex/') && process.env.CODEX_HOME)
    return path.resolve(process.env.CODEX_HOME, raw.slice('~/.codex/'.length));
  if (raw.startsWith('~/.openclaw/') && process.env.OPENCLAW_STATE_DIR)
    return path.resolve(
      process.env.OPENCLAW_STATE_DIR,
      raw.slice('~/.openclaw/'.length),
    );
  if (/^~[/\\]/.test(raw))
    return path.resolve(getHome(), raw.slice(2).replace(/\\/g, '/'));
  if (raw.startsWith('%USERPROFILE%')) {
    return path.resolve(
      getHome(),
      raw
        .slice('%USERPROFILE%'.length)
        .replace(/^[/\\]+/, '')
        .replace(/\\/g, '/'),
    );
  }
  if (raw.startsWith('%APPDATA%')) {
    const root = process.env['AGENT_ADD_HOME']
      ? path.join(getHome(), 'AppData', 'Roaming')
      : (process.env['APPDATA'] ?? path.join(getHome(), 'AppData', 'Roaming'));
    return path.resolve(
      root,
      raw
        .slice('%APPDATA%'.length)
        .replace(/^[/\\]+/, '')
        .replace(/\\/g, '/'),
    );
  }
  return path.resolve(cwd, raw);
}

export type ConfigFormat = 'json' | 'jsonc' | 'json5' | 'yaml';

export async function resolveConfigPath(
  capability: AssetCapability,
): Promise<string> {
  const override =
    capability.configPathEnv && process.env[capability.configPathEnv];
  if (override) return resolveHostPath(override);
  const raw =
    typeof capability.configFile === 'string'
      ? capability.configFile
      : capability.configFile?.[process.platform];
  if (!raw)
    throw new Error(
      'Host configuration path is not verified for this platform',
    );
  const candidates = [raw, ...(capability.configFileAlternatives ?? [])].map(
    (p) => resolveHostPath(p),
  );
  for (const file of candidates)
    if ((await readTextOrNull(file)) !== null) return file;
  return candidates[0]!;
}

export function parseConfig(
  content: string,
  format: ConfigFormat,
): Record<string, unknown> {
  let value: unknown;
  if (format === 'yaml') {
    const document = yaml.parseDocument(content);
    if (document.errors.length) throw new Error(document.errors[0]!.message);
    value = document.toJS() ?? {};
  } else if (format === 'json5') value = JSON5.parse(content);
  else if (format === 'jsonc') {
    const errors: ParseError[] = [];
    value = parse(content, errors, { allowTrailingComma: true });
    if (errors.length) throw new Error('Invalid JSONC configuration');
  } else value = JSON.parse(content);
  if (!isRecord(value)) throw new Error('Configuration must be an object');
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

export function setConfigValue(
  content: string,
  keyPath: string[],
  value: unknown,
  format: ConfigFormat,
): string {
  if (format === 'yaml') {
    parseConfig(content, format);
    const document = yaml.parseDocument(content);
    const current = document.getIn(keyPath, true);
    if (
      yaml.isSeq(current) &&
      Array.isArray(value) &&
      value.length >= current.items.length &&
      current.items.every(
        (item, index) => yaml.isScalar(item) && item.value === value[index],
      )
    ) {
      for (const item of value.slice(current.items.length)) current.add(item);
    } else if (
      yaml.isScalar(current) &&
      Array.isArray(value) &&
      value[0] === current.value
    ) {
      const sequence = document.createNode(value);
      sequence.items[0] = current;
      document.setIn(keyPath, sequence);
    } else {
      document.setIn(keyPath, value);
    }
    return document.toString();
  }
  if (format !== 'json5') {
    return applyEdits(
      content,
      modify(content, keyPath, value, {
        formattingOptions: {
          insertSpaces: true,
          tabSize: 2,
          eol: content.includes('\r\n') ? '\r\n' : '\n',
        },
      }),
    );
  }
  parseConfig(content, format);
  const root = parseExpressionAt(content, 0, { ecmaVersion: 2022 });
  let cursor = root;
  for (let index = 0; index < keyPath.length; index++) {
    if (cursor.type !== 'ObjectExpression')
      throw new Error('Configuration section must be an object');
    const object = cursor as ObjectExpression;
    const properties = object.properties.filter(
      (p): p is Property => p.type === 'Property',
    );
    const property = properties.find((p) => {
      const key = p.key as { name?: string; value?: unknown };
      return (key.name ?? key.value) === keyPath[index];
    });
    if (property && index < keyPath.length - 1) {
      cursor = property.value;
      continue;
    }
    let replacement = value;
    for (const key of keyPath.slice(index + 1).reverse())
      replacement = Object.fromEntries([[key, replacement]]);
    const rendered = JSON.stringify(replacement, null, 2);
    if (property)
      return (
        content.slice(0, property.value.start) +
        rendered +
        content.slice(property.value.end)
      );
    const last = properties.at(-1);
    const tail = last
      ? content
          .slice(last.end, object.end - 1)
          .replace(/\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g, '')
      : '';
    const needsComma = last && !tail.includes(',');
    const insertion =
      '\n' + JSON.stringify(keyPath[index]) + ': ' + rendered + '\n';
    const result =
      (needsComma
        ? content.slice(0, last.end) +
          ',' +
          content.slice(last.end, object.end - 1)
        : content.slice(0, object.end - 1)) +
      insertion +
      content.slice(object.end - 1);
    parseConfig(result, format);
    return result;
  }
  throw new Error('Configuration key path must not be empty');
}
