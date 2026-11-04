import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { HostId } from '../../src/hosts/types.js';

function sourceFiles(directory: string): ts.SourceFile[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return file.endsWith('.ts')
      ? [ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)]
      : [];
  });
}

const root = path.resolve('src');
const hosts = path.join(root, 'hosts') + path.sep;
const files = sourceFiles(root);

describe('host layer boundaries', () => {
  it('keeps concrete host identities inside the host layer', () => {
    const ids = new Set<string>(Object.values(HostId));
    const violations: string[] = [];
    for (const file of files.filter((file) => !file.fileName.startsWith(hosts))) {
      const visit = (node: ts.Node): void => {
        if (
          (ts.isStringLiteral(node) && ids.has(node.text)) ||
          (ts.isPropertyAccessExpression(node) &&
            ts.isIdentifier(node.expression) && node.expression.text === 'HostId')
        ) violations.push(path.relative(root, file.fileName) + ': ' + node.getText(file));
        ts.forEachChild(node, visit);
      };
      visit(file);
    }
    expect(violations).toEqual([]);
  });

  it('does not let host policy depend on installation orchestration', () => {
    const violations: string[] = [];
    for (const file of files.filter((file) => file.fileName.startsWith(hosts))) {
      for (const statement of file.statements) {
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
        const target = path.resolve(path.dirname(file.fileName), statement.moduleSpecifier.text);
        if (
          target.startsWith(path.join(root, 'assets') + path.sep) ||
          [path.join(root, 'installer.js'), path.join(root, 'cli.js')].includes(target)
        ) violations.push(path.relative(root, file.fileName) + ': ' + statement.moduleSpecifier.text);
      }
    }
    expect(violations).toEqual([]);
  });

  it('keeps native serialization out of asset handlers', () => {
    const codecs = new Set(['yaml', 'smol-toml', 'gray-matter', 'zod']);
    const violations: string[] = [];
    for (const file of files.filter((file) => file.fileName.startsWith(path.join(root, 'assets') + path.sep))) {
      for (const statement of file.statements) {
        if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && codecs.has(statement.moduleSpecifier.text))
          violations.push(path.relative(root, file.fileName) + ': ' + statement.moduleSpecifier.text);
      }
    }
    expect(violations).toEqual([]);
  });
});
