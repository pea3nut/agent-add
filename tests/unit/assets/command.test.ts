import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parse } from 'smol-toml';
import { commandHandler } from '../../../src/assets/command.js';
import { GeminiAdapter } from '../../../src/hosts/gemini.js';
import { CursorAdapter } from '../../../src/hosts/cursor.js';
import type { InstallJob } from '../../../src/assets/types.js';

describe('commandHandler', () => {
  let root: string;
  let job: InstallJob;
  let target: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-add-command-'));
    const host = new GeminiAdapter();
    host.assets.command.installDir = path.join(root, 'commands');
    const source = path.join(root, 'review.md');
    job = {
      assetType: 'command',
      assetName: 'review',
      host,
      resolvedSource: { type: 'local', localPath: source, originalSource: source },
    };
    target = path.join(root, 'commands/review.toml');
  });

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  async function install(content: string) {
    fs.writeFileSync(job.resolvedSource.localPath, content);
    return commandHandler.handle(job);
  }

  it('serializes plain Markdown as a Gemini prompt without changing its contents', async () => {
    const content = '# Review\n\nCheck {{args}} using @{README.md} and !{git diff}.\n';
    expect((await install(content)).status).toBe('written');
    expect(parse(fs.readFileSync(target, 'utf8'))).toEqual({ prompt: content });
  });

  it('maps description and removes unsupported frontmatter fields from the prompt', async () => {
    const content = '---\ndescription: Review changes\nallowed-tools: [Read, Bash]\n---\n# Review\nDo a review.\n';
    const result = await install(content);
    expect(result.status).toBe('written');
    expect(result.targetPath).toBe(target);
    expect(parse(fs.readFileSync(target, 'utf8'))).toEqual({
      description: 'Review changes', prompt: '# Review\nDo a review.\n',
    });
  });

  it('round-trips quotes, backslashes, Unicode and multiline text safely', async () => {
    const body = '# Review\n""" and \'\'\'\nC:\\code\\test\n审查 {{args}}\n';
    await install(`---\ndescription: 'Use "quotes" and \\paths'\n---\n${body}`);
    expect(parse(fs.readFileSync(target, 'utf8'))).toEqual({
      description: 'Use "quotes" and \\paths', prompt: body,
    });
  });

  it('handles BOM and CRLF frontmatter while preserving body line endings', async () => {
    await install('\uFEFF---\r\ndescription: Review\r\n---\r\n# Review\r\nBody\r\n');
    expect(parse(fs.readFileSync(target, 'utf8'))).toEqual({
      description: 'Review', prompt: '# Review\r\nBody\r\n',
    });
  });

  for (const metadata of ['', 'name: review\n']) {
    it(`supports frontmatter without a description: ${JSON.stringify(metadata)}`, async () => {
      await install(`---\n${metadata}---\n# Review\n`);
      expect(parse(fs.readFileSync(target, 'utf8'))).toEqual({ prompt: '# Review\n' });
    });
  }

  it('accepts frontmatter ending at EOF', async () => {
    await install('---\ndescription: Review\n---');
    expect(parse(fs.readFileSync(target, 'utf8'))).toEqual({ description: 'Review', prompt: '' });
  });

  for (const metadata of ['description: [invalid', '- item', '42', 'description: 42', 'description: null']) {
    it(`reports invalid frontmatter without writing a command: ${metadata}`, async () => {
      const result = await install(`---\n${metadata}\n---\n# Review\n`);
      expect(result.status).toBe('error');
      expect(result.reason).toContain('Failed to convert command source to TOML');
      expect(fs.existsSync(target)).toBe(false);
    });
  }

  it('compares the converted content on reinstall and preserves conflicting files', async () => {
    const content = '---\ndescription: Review\n---\n# Review\n';
    await install(content);
    const original = fs.readFileSync(target, 'utf8');
    expect((await install(content)).status).toBe('exists');
    expect((await install(content + 'Changed\n')).status).toBe('conflict');
    expect(fs.readFileSync(target, 'utf8')).toBe(original);
  });

  it('does not overwrite a raw Markdown file left by an older install', async () => {
    const content = '# Review\n';
    fs.mkdirSync(path.dirname(target));
    fs.writeFileSync(target, content);
    expect((await install(content)).status).toBe('conflict');
    expect(fs.readFileSync(target, 'utf8')).toBe(content);
  });

  it('keeps Markdown byte-for-byte for other hosts', async () => {
    const host = new CursorAdapter();
    host.assets.command.installDir = path.join(root, 'commands');
    job.host = host;
    const content = '---\ndescription: [not valid YAML\n---\n# Review\n';
    expect((await install(content)).status).toBe('written');
    expect(fs.readFileSync(path.join(root, 'commands/review.md'), 'utf8')).toBe(content);
    expect((await install(content)).status).toBe('exists');
  });

  it('reports unreadable sources without writing a command', async () => {
    const result = await commandHandler.handle(job);
    expect(result.status).toBe('error');
    expect(result.reason).toContain('Failed to read command source');
    expect(fs.existsSync(target)).toBe(false);
  });
});
