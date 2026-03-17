import { describe, it, expect } from 'vitest';
import { detectSourceType } from '../../../src/source/index.js';

describe('detectSourceType', () => {
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
