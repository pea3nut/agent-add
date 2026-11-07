import { lexer, Lexer, type Token } from 'marked';
import { getCategory } from 'unicode-properties';

function plainText(tokens: Token[]): string {
  return tokens.map((token) => {
    if (token.type === 'html') return '';
    if ('tokens' in token && token.tokens) return plainText(token.tokens);
    return 'text' in token ? token.text : ' ';
  }).join('');
}

export function markdownName(source: string): string {
  const heading = lexer(source).find((token) => token.type === 'heading' && token.depth === 1);
  if (!heading || heading.type !== 'heading') {
    throw new Error('Inline Markdown must contain a level-1 heading (e.g. # My Prompt) to infer the asset name');
  }
  let name = '';
  let separator = false;
  for (const character of plainText(heading.tokens ?? Lexer.lexInline(heading.text)).normalize('NFC').toLowerCase()) {
    const category = getCategory(character.codePointAt(0)!);
    const word = category.startsWith('L') || category.startsWith('N');
    const mark = category.startsWith('M') && name.length > 0 && !separator;
    if (word || mark) {
      if (separator && name) name += '-';
      name += character;
      separator = false;
    } else {
      separator = true;
    }
  }
  if (!name) throw new Error('Inline Markdown heading must contain at least one Unicode letter or number');
  return name;
}
