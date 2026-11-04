import type { HostAdapter, AssetCapability, AssetType } from './types.js';

const NOT_SUPPORTED = (reason: string): AssetCapability => ({
  supported: false,
  reason,
});

export class WindsurfAdapter implements HostAdapter {
  readonly id = 'windsurf';
  readonly displayName = 'Windsurf';
  readonly detection = {
    paths: ['.windsurf/'],
  };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: false,
      reason: 'No verified project-level MCP configuration target is supported.',
    },
    prompt: {
      supported: true,
      installDir: '.windsurf/rules',
      writeStrategy: 'create-file-in-dir',
    },
    skill: {
      supported: true,
      installDir: '.windsurf/skills',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: true,
      installDir: '.windsurf/workflows/',
      fileExtension: '.md',
      writeStrategy: 'copy-file',
    },
    subAgent: NOT_SUPPORTED('Windsurf does not have a sub-agent file format.'),
  };
}
