import { describe, it, expect } from 'vitest';
import { inferName } from '../../../src/source/infer-name.js';

describe('inferName', () => {
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
});
