export function describeSource(source: string): string {
  const trimmed = source.trim();
  if (trimmed.startsWith('{')) return '<inline JSON>';
  if (source.includes('\n')) return '<inline Markdown>';
  return redact(source);
}

export function redact(text: string): string {
  return text.replace(/https?:\/\/[^\s"'<>]+/g, (value) => {
    try {
      const url = new URL(value);
      url.username = '';
      url.password = '';
      if (url.search) url.search = '?REDACTED';
      return url.toString();
    } catch {
      return '<redacted URL>';
    }
  });
}
