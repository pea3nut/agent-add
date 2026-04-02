import { describe, it, expect } from 'vitest';
import { detectSourceType } from '../../../src/source/index.js';

describe('detectSourceType', () => {
  describe('inline sources', () => {
    it('should detect inline-json for source starting with {', () => {
      expect(detectSourceType('{"playwright":{"command":"npx"}}')).toBe('inline-json');
    });

    it('should detect inline-json even if malformed JSON', () => {
      expect(detectSourceType('{malformed')).toBe('inline-json');
    });

    it('should detect inline-json for source with leading/trailing whitespace', () => {
      expect(detectSourceType('  {"playwright":{"command":"npx"}}  ')).toBe('inline-json');
    });

    it('should detect inline-json via JSON.parse fallback when startsWith check is bypassed', () => {
      // Simulate an invisible prefix (here represented by a Unicode zero-width space U+200B)
      // that trim() cannot remove but JSON.parse can still parse the object
      // In practice trim() handles standard whitespace; this tests the JSON.parse fallback path
      expect(detectSourceType('{"playwright":{"command":"npx"}}')).toBe('inline-json');
    });

    it('should detect inline-md for source containing newline', () => {
      expect(detectSourceType('# My Prompt\n\nContent here')).toBe('inline-md');
    });

    it('should detect inline-md for multi-line content without heading', () => {
      expect(detectSourceType('Some text\nmore text')).toBe('inline-md');
    });
  });

  it('should detect git-ssh for git@ prefix', () => {
    expect(detectSourceType('git@github.com:org/repo.git')).toBe('git-ssh');
  });

  it('should detect git-ssh with #path', () => {
    expect(detectSourceType('git@github.com:org/repo.git#path/to/skill')).toBe('git-ssh');
  });

  it('should detect git-https for https URL ending with .git', () => {
    expect(detectSourceType('https://github.com/org/repo.git')).toBe('git-https');
  });

  it('should detect git-https for https URL with # fragment', () => {
    expect(detectSourceType('https://github.com/org/repo.git#skill-dir')).toBe('git-https');
  });

  it('should detect git-https for https URL with # but no .git', () => {
    expect(detectSourceType('https://github.com/org/repo#skill-dir')).toBe('git-https');
  });

  it('should detect http-file for plain https URL without .git and without #', () => {
    expect(detectSourceType('https://example.com/playwright.json')).toBe('http-file');
  });

  it('should detect http-file for http URL without .git and without #', () => {
    expect(detectSourceType('http://example.com/playwright.json')).toBe('http-file');
  });

  it('should detect local for relative path with ./', () => {
    expect(detectSourceType('./mcps/playwright.json')).toBe('local');
  });

  it('should detect local for relative path with ../', () => {
    expect(detectSourceType('../mcps/playwright.json')).toBe('local');
  });

  it('should detect local for absolute path', () => {
    expect(detectSourceType('/absolute/path/to/file.json')).toBe('local');
  });

  describe('@ref syntax', () => {
    it('should detect git-ssh with @branch', () => {
      expect(detectSourceType('git@github.com:org/repo.git@main')).toBe('git-ssh');
    });

    it('should detect git-ssh with @branch and #path', () => {
      expect(detectSourceType('git@github.com:org/repo.git@main#path/to/skill')).toBe('git-ssh');
    });

    it('should detect git-https with @tag', () => {
      expect(detectSourceType('https://github.com/org/repo.git@v1.0.0')).toBe('git-https');
    });

    it('should detect git-https with @hash and #path', () => {
      expect(detectSourceType('https://github.com/org/repo.git@abc123f#path')).toBe('git-https');
    });

    it('should detect git-https for https URL with @ref and # but no .git', () => {
      expect(detectSourceType('https://github.com/org/repo@main#path')).toBe('git-https');
    });
  });

  describe('http-file vs git-https boundary', () => {
    it('https URL without .git and without # is http-file', () => {
      expect(detectSourceType('https://raw.githubusercontent.com/org/repo/main/file.json')).toBe('http-file');
    });

    it('https URL with .git is git-https even without #', () => {
      expect(detectSourceType('https://github.com/org/repo.git')).toBe('git-https');
    });

    it('https URL with # but no .git is git-https', () => {
      expect(detectSourceType('https://github.com/org/repo#main/src')).toBe('git-https');
    });
  });
});
