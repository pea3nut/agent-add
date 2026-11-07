import { parse, stringify } from 'smol-toml';
import { parseTOML, type AST } from 'toml-eslint-parser';
import { deepEqualIgnoringKeyOrder } from './deep-equal.js';
import { isRecord } from './config.js';

type KeyPath = (string | number)[];
type Pair = { path: KeyPath; node: AST.TOMLKeyValue };
const identity = (path: KeyPath) => JSON.stringify(path);
const within = (path: KeyPath, prefix: KeyPath) =>
  prefix.length <= path.length && prefix.every((key, i) => path[i] === key);
const record = (value: unknown): value is Record<string, unknown> => isRecord(value) && !(value instanceof Date);

function valueAt(value: unknown, path: KeyPath): unknown {
  for (const key of path) {
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, key)) return undefined;
    value = (value as Record<string | number, unknown>)[key];
  }
  return value;
}

function literal(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(literal).join(', ') + ']';
  if (record(value)) return '{ ' + Object.entries(value)
    .map(([key, item]) => JSON.stringify(key) + ' = ' + literal(item)).join(', ') + ' }';
  const text = stringify({ value });
  return text.slice(text.indexOf('=') + 1).trim();
}

/** Source ranges come from the TOML parser, never line/section matching. */
class Document {
  readonly ast: AST.TOMLProgram;
  readonly values = new Map<string, AST.TOMLContentNode>();
  readonly pairs: Pair[] = [];
  readonly tables: AST.TOMLTable[] = [];
  readonly eol: string;

  constructor(readonly text: string) {
    this.ast = parseTOML(text, { tomlVersion: '1.1' });
    this.eol = text.includes('\r\n') ? '\r\n' : '\n';
    const visitValue = (node: AST.TOMLContentNode, path: KeyPath) => {
      this.values.set(identity(path), node);
      if (node.type === 'TOMLInlineTable')
        for (const pair of node.body) visitPair(pair, path);
      else if (node.type === 'TOMLArray')
        node.elements.forEach((element, index) => visitValue(element, [...path, index]));
    };
    const visitPair = (node: AST.TOMLKeyValue, parent: KeyPath) => {
      const path = [...parent, ...node.key.keys.map((key) => key.type === 'TOMLBare' ? key.name : key.value)];
      this.pairs.push({ path, node });
      visitValue(node.value, path);
    };
    for (const node of this.ast.body[0].body) {
      if (node.type === 'TOMLKeyValue') visitPair(node, []);
      else {
        this.tables.push(node);
        for (const pair of node.body) visitPair(pair, node.resolvedKey);
      }
    }
  }

  lineEnd(offset: number): number {
    const end = this.text.indexOf('\n', offset);
    return end < 0 ? this.text.length : end + 1;
  }

  insert(offset: number, value: string): string {
    return this.text.slice(0, offset) + value + this.text.slice(offset);
  }

  /** Erase syntax only: comments and surrounding whitespace belong to the user. */
  erase(ranges: [number, number][]): string {
    const tokens = this.ast.tokens.filter((token) => ranges.some(([start, end]) =>
      token.range[0] >= start && token.range[1] <= end));
    let result = this.text;
    for (const token of tokens.reverse())
      result = result.slice(0, token.range[0]) + result.slice(token.range[1]);
    return result;
  }

  removeItem(node: AST.TOMLKeyValue | AST.TOMLContentNode): string {
    const parent = node.parent;
    const siblings = parent.type === 'TOMLInlineTable' ? parent.body
      : parent.type === 'TOMLArray' ? parent.elements : null;
    const ranges: [number, number][] = [node.range];
    if (siblings) {
      const index = (siblings as AST.TOMLNode[]).indexOf(node);
      const next = siblings[index + 1];
      const comma = this.ast.tokens.find((token) => token.value === ',' &&
        token.range[0] >= node.range[1] && token.range[1] <= (next?.range[0] ?? parent.range[1] - 1));
      const previous = siblings[index - 1];
      const before = !comma && previous ? this.ast.tokens.find((token) => token.value === ',' &&
        token.range[0] >= previous.range[1] && token.range[1] <= node.range[0]) : undefined;
      if (comma || before) ranges.push((comma ?? before)!.range);
    }
    return this.erase(ranges);
  }

  add(path: KeyPath, value: unknown): string {
    let parentPath = path.slice(0, -1);
    let parent = this.values.get(identity(parentPath));
    if (parent?.type !== 'TOMLInlineTable' && parent?.type !== 'TOMLArray') {
      const inline = [...this.values].map(([key, node]) => ({ path: JSON.parse(key) as KeyPath, node }))
        .filter((entry) => entry.node.type === 'TOMLInlineTable' && within(path, entry.path) && entry.path.length < path.length)
        .sort((a, b) => b.path.length - a.path.length)[0];
      if (inline) { parent = inline.node; parentPath = inline.path; }
    }
    if (parent?.type === 'TOMLInlineTable' || parent?.type === 'TOMLArray') {
      const items = parent.type === 'TOMLInlineTable' ? parent.body : parent.elements;
      const last = items[items.length - 1];
      const trailingComma = last && this.ast.tokens.some((token) => token.value === ',' &&
        token.range[0] >= last.range[1] && token.range[1] < parent.range[1]);
      const prefix = items.length && !trailingComma ? ', ' : '';
      const item = parent.type === 'TOMLInlineTable' ? path.slice(parentPath.length).map((key) => JSON.stringify(key)).join('.') + ' = ' + literal(value) : literal(value);
      return this.insert(parent.range[1] - 1, prefix + item);
    }
    if (typeof path[path.length - 1] === 'number') {
      if (!record(value)) throw new Error('TOML array tables require object entries');
      const key = path.slice(0, -1).map((part) => JSON.stringify(part)).join('.');
      const body = Object.entries(value).map(([name, item]) => JSON.stringify(name) + ' = ' + literal(item)).join(this.eol);
      return this.insert(this.text.length, this.eol + '[[' + key + ']]' + this.eol + body + this.eol);
    }
    const context = this.tables.filter((table) => within(path, table.resolvedKey) && path.length > table.resolvedKey.length)
      .sort((a, b) => b.resolvedKey.length - a.resolvedKey.length)[0];
    const relative = path.slice(context?.resolvedKey.length ?? 0);
    const assignment = relative.map((key) => JSON.stringify(key)).join('.') + ' = ' + literal(value) + this.eol;
    const last = context?.body[context.body.length - 1];
    const position = context ? this.lineEnd(last?.range[1] ?? context.key.range[1])
      : this.tables[0] ? this.text.lastIndexOf('\n', this.tables[0].range[0] - 1) + 1 : this.text.length;
    const separator = position > 0 && this.text[position - 1] !== '\n' ? this.eol : '';
    return this.insert(position, separator + assignment);
  }
}

/** Remove a value/table without consuming any comment tokens. */
function remove(text: string, path: KeyPath): string {
  let document = new Document(text);
  const value = document.values.get(identity(path));
  if (value) return document.removeItem(value.parent.type === 'TOMLKeyValue' ? value.parent : value);
  let pair = document.pairs.find((entry) => within(entry.path, path));
  while (pair) {
    text = document.removeItem(pair.node);
    document = new Document(text);
    pair = document.pairs.find((entry) => within(entry.path, path));
  }
  const headers = document.tables.filter((table) => within(table.resolvedKey, path)).map((table): [number, number] =>
    [table.range[0], table.body[0]?.range[0] ?? table.range[1]]);
  return document.erase(headers);
}

/** Change only owned syntax; unchanged scalar spellings, comments and trivia survive. */
export function setTomlValue(text: string, path: KeyPath, value: unknown): string {
  if (value === undefined) return remove(text, path);
  const current = valueAt(text.trim() ? parse(text) : {}, path);
  if (record(current) && record(value)) {
    for (const key of Object.keys(current))
      if (!Object.hasOwn(value, key)) text = setTomlValue(text, [...path, key], undefined);
    for (const [key, item] of Object.entries(value)) text = setTomlValue(text, [...path, key], item);
    return text;
  }
  if (Array.isArray(current) && Array.isArray(value)) {
    for (let index = current.length - 1; index >= value.length; index--)
      text = setTomlValue(text, [...path, index], undefined);
    for (let index = 0; index < value.length; index++)
      text = setTomlValue(text, [...path, index], value[index]);
    return text;
  }
  if (deepEqualIgnoringKeyOrder(current, value)) return text;
  const document = new Document(text);
  const node = document.values.get(identity(path));
  if (!node) return (current === undefined ? document : new Document(remove(text, path))).add(path, value);
  const comments = document.ast.comments.filter((comment) => comment.range[0] >= node.range[0] && comment.range[1] <= node.range[1]);
  const preserved = comments.length ? document.eol + comments.map((comment) => text.slice(...comment.range)).join(document.eol) + document.eol : '';
  return text.slice(0, node.range[0]) + literal(value) + preserved + text.slice(node.range[1]);
}
