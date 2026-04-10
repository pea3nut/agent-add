import { describe, it, expect } from 'vitest';
import { normalizeGitUrl } from '../../../src/source/index.js';

describe('normalizeGitUrl', () => {
  describe('GitHub web URLs', () => {
    it('should convert plain repo URL', () => {
      expect(normalizeGitUrl('https://github.com/anthropics/claude-code')).toBe(
        'https://github.com/anthropics/claude-code.git',
      );
    });

    it('should convert repo URL with trailing slash', () => {
      expect(normalizeGitUrl('https://github.com/anthropics/claude-code/')).toBe(
        'https://github.com/anthropics/claude-code.git',
      );
    });

    it('should convert /tree/ref/path URL', () => {
      expect(
        normalizeGitUrl('https://github.com/anthropics/claude-code/tree/main/skills/pdf'),
      ).toBe('https://github.com/anthropics/claude-code.git#skills/pdf@main');
    });

    it('should convert /blob/ref/path URL', () => {
      expect(
        normalizeGitUrl('https://github.com/anthropics/claude-code/blob/v2/config.json'),
      ).toBe('https://github.com/anthropics/claude-code.git#config.json@v2');
    });

    it('should convert /tree/ref URL without subpath', () => {
      expect(
        normalizeGitUrl('https://github.com/anthropics/claude-code/tree/main'),
      ).toBe('https://github.com/anthropics/claude-code.git@main');
    });

    it('should handle www. prefix', () => {
      expect(normalizeGitUrl('https://www.github.com/owner/repo')).toBe(
        'https://github.com/owner/repo.git',
      );
    });

    it('should handle URL that already has .git suffix', () => {
      expect(normalizeGitUrl('https://github.com/owner/repo.git')).toBe(
        'https://github.com/owner/repo.git',
      );
    });

    it('should handle http:// (non-https)', () => {
      expect(normalizeGitUrl('http://github.com/owner/repo')).toBe(
        'https://github.com/owner/repo.git',
      );
    });
  });

  describe('GitLab web URLs', () => {
    it('should convert plain repo URL', () => {
      expect(normalizeGitUrl('https://gitlab.com/owner/repo')).toBe(
        'https://gitlab.com/owner/repo.git',
      );
    });

    it('should convert /-/tree/ref/path URL', () => {
      expect(
        normalizeGitUrl('https://gitlab.com/owner/repo/-/tree/main/src/lib'),
      ).toBe('https://gitlab.com/owner/repo.git#src/lib@main');
    });

    it('should convert /-/blob/ref/path URL', () => {
      expect(
        normalizeGitUrl('https://gitlab.com/owner/repo/-/blob/dev/config.json'),
      ).toBe('https://gitlab.com/owner/repo.git#config.json@dev');
    });

    it('should handle www. prefix', () => {
      expect(normalizeGitUrl('https://www.gitlab.com/owner/repo')).toBe(
        'https://gitlab.com/owner/repo.git',
      );
    });
  });

  describe('passthrough (no transformation)', () => {
    it('should not transform inline JSON', () => {
      const json = '{"playwright":{"command":"npx"}}';
      expect(normalizeGitUrl(json)).toBe(json);
    });

    it('should not transform inline Markdown', () => {
      const md = '# My Prompt\n\nContent here';
      expect(normalizeGitUrl(md)).toBe(md);
    });

    it('should not transform git SSH URLs', () => {
      const ssh = 'git@github.com:org/repo.git';
      expect(normalizeGitUrl(ssh)).toBe(ssh);
    });

    it('should not transform local paths', () => {
      expect(normalizeGitUrl('./mcps/playwright.json')).toBe('./mcps/playwright.json');
    });

    it('should not transform absolute paths', () => {
      expect(normalizeGitUrl('/absolute/path/to/file.json')).toBe('/absolute/path/to/file.json');
    });

    it('should not transform already-valid git HTTPS URLs', () => {
      const url = 'https://github.com/org/repo.git#path/to/skill';
      expect(normalizeGitUrl(url)).toBe(url);
    });

    it('should not transform git HTTPS URLs with #fragment (regression: # must not leak into owner/repo match)', () => {
      const url = 'https://github.com/wshobson/commands.git#workflows';
      expect(normalizeGitUrl(url)).toBe(url);
    });

    it('should not transform non-GitHub/GitLab HTTPS URLs', () => {
      const url = 'https://example.com/playwright.json';
      expect(normalizeGitUrl(url)).toBe(url);
    });

    it('should not transform raw.githubusercontent.com URLs', () => {
      const url = 'https://raw.githubusercontent.com/org/repo/main/file.json';
      expect(normalizeGitUrl(url)).toBe(url);
    });
  });
});
