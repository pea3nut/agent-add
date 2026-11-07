import { applyEdits, createScanner, findNodeAtLocation, getNodeValue, parseTree, SyntaxKind, type Node } from 'jsonc-parser';
import { deepEqualIgnoringKeyOrder } from './deep-equal.js';

type KeyPath = (string | number)[];
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const trivia = new Set([SyntaxKind.Trivia, SyntaxKind.LineBreakTrivia, SyntaxKind.LineCommentTrivia, SyntaxKind.BlockCommentTrivia]);

function tokens(text: string) {
  const scanner = createScanner(text);
  const result = [];
  for (let kind = scanner.scan(); kind !== SyntaxKind.EOF; kind = scanner.scan())
    result.push({ kind, start: scanner.getTokenOffset(), end: scanner.getTokenOffset() + scanner.getTokenLength() });
  return result;
}

function remove(text: string, node: Node): string {
  const item = node.parent?.type === 'property' ? node.parent : node;
  const siblings = item.parent?.children ?? [];
  const index = siblings.indexOf(item);
  const all = tokens(text);
  const comma = all.find((token) => token.kind === SyntaxKind.CommaToken &&
    token.start >= item.offset + item.length && token.end <= (siblings[index + 1]?.offset ?? item.parent!.offset + item.parent!.length - 1));
  const previous = siblings[index - 1];
  const before = !comma && previous ? all.find((token) => token.kind === SyntaxKind.CommaToken &&
    token.start >= previous.offset + previous.length && token.end <= item.offset) : undefined;
  return applyEdits(text, all.filter((token) => !trivia.has(token.kind) &&
    ((token.start >= item.offset && token.end <= item.offset + item.length) || token === (comma ?? before)))
    .map((token) => ({ offset: token.start, length: token.end - token.start, content: '' })));
}

/** Patch leaves/collection members so comments inside an existing value survive. */
export function setJsonValue(text: string, path: KeyPath, value: unknown): string {
  const tree = parseTree(text);
  if (!tree) throw new Error('Invalid object configuration');
  const node = findNodeAtLocation(tree, path);
  if (value === undefined) return node ? remove(text, node) : text;
  const current: unknown = node ? getNodeValue(node) : undefined;
  if (object(current) && object(value)) {
    for (const key of Object.keys(current))
      if (!Object.hasOwn(value, key)) text = setJsonValue(text, [...path, key], undefined);
    for (const [key, item] of Object.entries(value)) text = setJsonValue(text, [...path, key], item);
    return text;
  }
  if (Array.isArray(current) && Array.isArray(value)) {
    for (let index = current.length - 1; index >= value.length; index--)
      text = setJsonValue(text, [...path, index], undefined);
    for (let index = 0; index < value.length; index++) text = setJsonValue(text, [...path, index], value[index]);
    return text;
  }
  if (deepEqualIgnoringKeyOrder(current, value)) return text;
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  if (node) {
    const comments = tokens(text).filter((token) =>
      (token.kind === SyntaxKind.LineCommentTrivia || token.kind === SyntaxKind.BlockCommentTrivia) &&
      token.start >= node.offset && token.end <= node.offset + node.length);
    const retained = comments.map((comment) => text.slice(comment.start, comment.end) + eol).join('');
    return text.slice(0, node.offset) + retained + JSON.stringify(value) + text.slice(node.offset + node.length);
  }
  const parent = findNodeAtLocation(tree, path.slice(0, -1));
  const key = path[path.length - 1]!;
  if (!parent) {
    if (typeof key !== 'string') throw new Error('Cannot insert into a missing JSON array');
    return setJsonValue(text, path.slice(0, -1), { [key]: value });
  }
  if (parent.type !== 'object' && parent.type !== 'array')
    throw new Error('Configuration parent must be an object or array');
  const children = parent.children ?? [];
  if (parent.type === 'array' && key !== children.length)
    throw new Error('JSON array insertion must append the next item');
  const last = children[children.length - 1];
  const position = parent.offset + parent.length - 1;
  const comma = last && tokens(text).some((token) => token.kind === SyntaxKind.CommaToken &&
    token.start >= last.offset + last.length && token.end <= position);
  const prefix = children.length && !comma ? ', ' : '';
  const added = (parent.type === 'object' ? JSON.stringify(key) + ': ' : '') + JSON.stringify(value);
  return text.slice(0, position) + prefix + added + text.slice(position);
}
