import { describe, it, expect } from 'vitest';
import { parseGitSource } from '../../../src/source/git.js';

describe('parseGitSource', () => {
  describe('HTTPS URLs', () => {
    it('parses a plain repo URL with no ref or subpath', () => {
      expect(parseGitSource('https://github.com/org/repo.git')).toEqual({
        repoUrl: 'https://github.com/org/repo.git',
        ref: undefined,
        subPath: undefined,
      });
    });

    it('parses @ref', () => {
      expect(parseGitSource('https://github.com/org/repo.git@v1.0.0')).toEqual({
        repoUrl: 'https://github.com/org/repo.git',
        ref: 'v1.0.0',
        subPath: undefined,
      });
    });

    it('parses #subPath', () => {
      expect(parseGitSource('https://github.com/org/repo.git#skills/pdf')).toEqual({
        repoUrl: 'https://github.com/org/repo.git',
        ref: undefined,
        subPath: 'skills/pdf',
      });
    });

    it('parses #subPath@ref', () => {
      expect(parseGitSource('https://github.com/org/repo.git#skills/pdf@main')).toEqual({
        repoUrl: 'https://github.com/org/repo.git',
        ref: 'main',
        subPath: 'skills/pdf',
      });
    });

    it('does not mistake a token embedded as userinfo for the ref separator', () => {
      expect(parseGitSource('https://ghp_token123@github.com/org/repo.git@v1.0.0')).toEqual({
        repoUrl: 'https://ghp_token123@github.com/org/repo.git',
        ref: 'v1.0.0',
        subPath: undefined,
      });
    });

    it('does not mistake user:pass credentials for the ref separator', () => {
      expect(parseGitSource('https://user:pass@github.com/org/repo.git')).toEqual({
        repoUrl: 'https://user:pass@github.com/org/repo.git',
        ref: undefined,
        subPath: undefined,
      });
    });

    it('parses the documented @ref#path ordering', () => {
      expect(parseGitSource('https://github.com/org/repo.git@v1.0#path/to/skill')).toEqual({
        repoUrl: 'https://github.com/org/repo.git',
        ref: 'v1.0',
        subPath: 'path/to/skill',
      });
    });

    it('preserves credentials and still parses ref + subpath together', () => {
      expect(
        parseGitSource('https://user:pass@github.com/org/repo.git#skills/pdf@main'),
      ).toEqual({
        repoUrl: 'https://user:pass@github.com/org/repo.git',
        ref: 'main',
        subPath: 'skills/pdf',
      });
    });
  });

  describe('SSH URLs', () => {
    it('parses a plain repo URL with no ref', () => {
      expect(parseGitSource('git@github.com:org/repo.git')).toEqual({
        repoUrl: 'git@github.com:org/repo.git',
        ref: undefined,
        subPath: undefined,
      });
    });

    it('parses @ref, skipping the leading git@ prefix', () => {
      expect(parseGitSource('git@github.com:org/repo.git@v1.0.0')).toEqual({
        repoUrl: 'git@github.com:org/repo.git',
        ref: 'v1.0.0',
        subPath: undefined,
      });
    });
  });
});
