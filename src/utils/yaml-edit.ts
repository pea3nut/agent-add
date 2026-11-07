import yaml from 'yaml';
import { deepEqualIgnoringKeyOrder } from './deep-equal.js';

/** Splice only the changed root property, retaining the rest of the user's source. */
export function updateYamlProperty(source: string, document: yaml.Document, key: string): string {
  const original = yaml.parseDocument(source);
  const rendered = document.toString({ lineWidth: 0 });
  const updated = yaml.parseDocument(rendered);
  if (!yaml.isMap(updated.contents)) throw new Error('YAML configuration must be a mapping');
  const replacement = updated.contents.items.find((pair) => yaml.isScalar(pair.key) && pair.key.value === key);
  if (!replacement || !yaml.isScalar(replacement.key) || !yaml.isNode(replacement.value) || !replacement.value.range)
    throw new Error('Cannot locate the updated YAML property');
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const start = replacement.key.range![0];
  const end = replacement.value.range[2];
  let property = rendered.slice(start, end).split('\n').join(eol);
  const mapping = original.contents;
  const previous = yaml.isMap(mapping) ? mapping.items.find((pair) => yaml.isScalar(pair.key) && pair.key.value === key) : undefined;
  const indentAt = (offset: number) => {
    const prefix = source.slice(source.lastIndexOf('\n', offset - 1) + 1, offset);
    return [...prefix].every((character) => character === ' ' || character === '\t') ? prefix : '';
  };
  const indentLines = (text: string, indent: string) => text.split(eol)
    .map((line, index) => index > 0 && line ? indent + line : line).join(eol);
  let result: string;
  if (previous && yaml.isScalar(previous.key) && yaml.isNode(previous.value) && previous.value.range) {
    if (yaml.isMap(mapping) && !mapping.flow) property = indentLines(property, indentAt(previous.key.range![0]));
    result = source.slice(0, previous.key.range![0]) + property + source.slice(previous.value.range[2]);
  } else if (yaml.isMap(mapping) && mapping.flow) {
    const last = mapping.items[mapping.items.length - 1];
    const position = last && yaml.isNode(last.value) && last.value.range ? last.value.range[1]
      : last && yaml.isScalar(last.key) ? source.indexOf(':', last.key.range![1]) + 1 : mapping.range![0] + 1;
    property = property.trimEnd();
    result = source.slice(0, position) + (last ? ', ' : '') + property + source.slice(position);
  } else {
    const position = mapping?.range?.[1] ?? source.length;
    const separator = position > 0 && source[position - 1] !== '\n' ? eol : '';
    if (yaml.isMap(mapping) && mapping.range) {
      const indent = indentAt(mapping.range[0]);
      property = indent + indentLines(property, indent);
    }
    result = source.slice(0, position) + separator + property + source.slice(position);
  }
  const checked = yaml.parseDocument(result);
  const expected = original.contents === null ? {} : original.toJS();
  Object.defineProperty(expected, key, { value: document.toJS()[key], enumerable: true });
  if (checked.errors.length || !deepEqualIgnoringKeyOrder(checked.toJS(), expected))
    throw new Error('YAML edit did not preserve the planned configuration');
  return result;
}
