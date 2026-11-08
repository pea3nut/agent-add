import path from 'path';
import yaml from 'yaml';
import { isRecord, parseConfig, readTextOrNull, resolveConfigPath, setConfigValue } from '../utils/config.js';
import type { AssetCapability, HostAdapter } from './types.js';
import { deepEqualIgnoringKeyOrder } from '../utils/deep-equal.js';

export async function registerPromptFile(
  host: HostAdapter,
  target: string,
  configCapability: AssetCapability,
  key: string,
  format: 'yaml' | 'jsonc',
): Promise<{ file: string; content: string; } | null> {
  const file = await resolveConfigPath(configCapability);
  const existing = (await readTextOrNull(file)) ?? '{}\n';
  const document = format === 'yaml' ? yaml.parseDocument(existing, { intAsBigInt: true }) : null;
  if (document?.errors.length) throw new Error(document.errors[0]!.message);
  const config: unknown = document
    ? document.contents === null ? {} : document.toJS()
    : parseConfig(existing, 'jsonc');
  if (!isRecord(config)) throw new Error('Configuration must be an object');
  const value = config[key];
  const items =
    format === 'yaml' && typeof value === 'string' ? [value] : (value ?? []);
  if (!Array.isArray(items) || items.some((v) => typeof v !== 'string'))
    throw new Error("Configuration '" + key + "' must contain file paths");
  const root = host.rootDir ?? process.cwd();
  const relative = path
    .relative(root, target)
    .split(path.sep)
    .join('/');
  if (items.some((v) => path.resolve(root, v) === target))
    return null;
  if (document) {
    const current = document.get(key, true);
    if (yaml.isSeq(current)) current.add(relative);
    else {
      const sequence = document.createNode([...items, relative]);
      if (yaml.isScalar(current) && typeof current.value === 'string') sequence.items[0] = current;
      else if (yaml.isNode(current)) {
        sequence.comment = current.comment;
        sequence.commentBefore = current.commentBefore;
      }
      document.set(key, sequence);
    }
    const content = document.toString({ lineWidth: 0 });
    const checked = yaml.parseDocument(content, { intAsBigInt: true });
    const expected = { ...config, [key]: [...items, relative] };
    if (checked.errors.length || !deepEqualIgnoringKeyOrder(checked.toJS(), expected))
      throw new Error('YAML registration would change unrelated configuration; check aliases');
    return { file, content };
  }
  return { file, content: setConfigValue(existing, [key], [...items, relative], 'jsonc') };
}
