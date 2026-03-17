import { describe, it, expect } from 'vitest';
import { ManifestSchema } from '../../../src/manifest/schema.js';

const validAsset = { type: 'mcp' as const, source: './tool.json' };

describe('ManifestSchema', () => {
  describe('valid cases', () => {
    it('should accept a well-formed manifest', () => {
      const result = ManifestSchema.safeParse({
        name: 'my-org/my-pack',
        assets: [validAsset],
      });
      expect(result.success).toBe(true);
    });

    it('should accept all valid asset types', () => {
      const types = ['mcp', 'skill', 'prompt', 'command', 'subAgent'] as const;
      for (const type of types) {
        const result = ManifestSchema.safeParse({
          name: 'org/pack',
          assets: [{ type, source: './file.json' }],
        });
        expect(result.success, `type '${type}' should be valid`).toBe(true);
      }
    });

    it('should accept source as an array of strings', () => {
      const result = ManifestSchema.safeParse({
        name: 'org/pack',
        assets: [{ type: 'mcp', source: ['./a.json', './b.json'] }],
      });
      expect(result.success).toBe(true);
    });

    it('should accept multiple assets', () => {
      const result = ManifestSchema.safeParse({
        name: 'org/pack',
        assets: [
          { type: 'mcp', source: './mcp.json' },
          { type: 'skill', source: './skill.md' },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid name format', () => {
    it('should reject name without slash', () => {
      const result = ManifestSchema.safeParse({
        name: 'mypack',
        assets: [validAsset],
      });
      expect(result.success).toBe(false);
    });

    it('should reject name with special characters like @', () => {
      const result = ManifestSchema.safeParse({
        name: 'ns/pack@1',
        assets: [validAsset],
      });
      expect(result.success).toBe(false);
    });

    it('should reject name with more than one slash', () => {
      const result = ManifestSchema.safeParse({
        name: 'a/b/c',
        assets: [validAsset],
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const result = ManifestSchema.safeParse({
        name: '',
        assets: [validAsset],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('invalid assets', () => {
    it('should reject empty assets array', () => {
      const result = ManifestSchema.safeParse({
        name: 'org/pack',
        assets: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject unknown asset type', () => {
      const result = ManifestSchema.safeParse({
        name: 'org/pack',
        assets: [{ type: 'plugin', source: './tool.json' }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject asset with empty source string', () => {
      const result = ManifestSchema.safeParse({
        name: 'org/pack',
        assets: [{ type: 'mcp', source: '' }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject asset with empty source array', () => {
      const result = ManifestSchema.safeParse({
        name: 'org/pack',
        assets: [{ type: 'mcp', source: [] }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('missing required fields', () => {
    it('should reject manifest without name', () => {
      const result = ManifestSchema.safeParse({ assets: [validAsset] });
      expect(result.success).toBe(false);
    });

    it('should reject manifest without assets', () => {
      const result = ManifestSchema.safeParse({ name: 'org/pack' });
      expect(result.success).toBe(false);
    });
  });
});
