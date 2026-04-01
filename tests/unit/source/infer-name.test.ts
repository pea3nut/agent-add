import { describe, it, expect } from 'vitest';
import { inferName } from '../../../src/source/infer-name.js';

describe('inferName', () => {
  describe('inline JSON', () => {
    it('should extract single top-level key as name', () => {
      expect(inferName('{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}')).toBe('playwright');
    });

    it('should throw for inline JSON with multiple keys', () => {
      expect(() => inferName('{"a":{},"b":{}}')).toThrow();
    });

    it('should throw for inline JSON with no keys', () => {
      expect(() => inferName('{}')).toThrow();
    });

    it('should throw for malformed inline JSON', () => {
      expect(() => inferName('{malformed')).toThrow();
    });

    it('should extract server name from wrapped mcpServers format', () => {
      expect(inferName('{"mcpServers":{"playwright":{"command":"npx","args":["-y","@playwright/mcp"]}}}')).toBe('playwright');
    });

    it('should throw for wrapped mcpServers with multiple servers', () => {
      expect(() => inferName('{"mcpServers":{"a":{"command":"x"},"b":{"command":"y"}}}')).toThrow();
    });
  });

  describe('inline Markdown', () => {
    it('should extract kebab-cased name from # heading', () => {
      expect(inferName('# My Inline Prompt\n\nContent here')).toBe('my-inline-prompt');
    });

    it('should handle heading with special characters', () => {
      expect(inferName('# Hello World!\n\nContent')).toBe('hello-world');
    });

    it('should find heading even if not first line', () => {
      expect(inferName('\n# My Prompt\n\nContent')).toBe('my-prompt');
    });

    it('should throw if no # heading found', () => {
      expect(() => inferName('No heading here\nJust content')).toThrow();
    });
  });

  it('should infer name from local file path by stripping extension', () => {
    expect(inferName('./mcps/playwright.json')).toBe('playwright');
  });

  it('should infer name from git SSH URL with #path (last segment)', () => {
    expect(inferName('git@github.com:demo/skills.git#e2e-guide')).toBe('e2e-guide');
  });

  it('should infer name from git SSH URL with #nested/path (last segment)', () => {
    expect(inferName('git@github.com:demo/skills.git#path/to/skill')).toBe('skill');
  });

  it('should infer name from local .md file', () => {
    expect(inferName('./prompts/dev-practices.md')).toBe('dev-practices');
  });

  it('should infer command name from local .md file', () => {
    expect(inferName('./commands/init.md')).toBe('init');
  });

  it('should infer sub-agent name from local .md file', () => {
    expect(inferName('./agents/code-reviewer.md')).toBe('code-reviewer');
  });

  it('should infer name from git URL without #path (repo name without .git)', () => {
    expect(inferName('git@github.com:org/repo.git')).toBe('repo');
  });

  it('should infer name from git HTTPS URL with #path', () => {
    expect(inferName('https://github.com/org/repo.git#skill-dir')).toBe('skill-dir');
  });

  it('should infer name from HTTP URL (filename without extension)', () => {
    expect(inferName('https://example.com/playwright.json')).toBe('playwright');
  });

  describe('@ref syntax', () => {
    it('should infer name from git SSH URL with @branch and #path (last segment wins)', () => {
      expect(inferName('git@github.com:org/skills.git@main#path/to/skill')).toBe('skill');
    });

    it('should infer name from git SSH URL with @branch (repo name, no .git extension)', () => {
      expect(inferName('git@github.com:org/repo.git@main')).toBe('repo');
    });

    it('should infer name from git SSH URL with @branch and no .git suffix', () => {
      expect(inferName('git@github.com:org/repo@dev')).toBe('repo');
    });

    it('should infer name from git HTTPS URL with @tag and #path', () => {
      expect(inferName('https://github.com/org/repo.git@v2#tools/mytool')).toBe('mytool');
    });

    it('should infer name from git HTTPS URL with @hash (repo name)', () => {
      expect(inferName('https://github.com/org/repo.git@abc123f')).toBe('repo');
    });
  });
});
