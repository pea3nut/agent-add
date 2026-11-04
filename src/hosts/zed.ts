import type { HostAdapter, AssetCapability, AssetType } from './types.js';

export class ZedAdapter implements HostAdapter {
  readonly id = 'zed';
  readonly displayName = 'Zed Agent';
  readonly detection = { paths: ['.zed/'] };
  readonly assets: Record<AssetType, AssetCapability> = {
    mcp: {
      supported: false,
      reason: 'No verified project-level MCP configuration target is supported.',
    },
    prompt: {
      supported: true,
      targetFile: 'AGENTS.md',
      writeStrategy: 'append-with-marker',
    },
    skill: {
      supported: true,
      installDir: '.agents/skills/',
      entryFile: 'SKILL.md',
      writeStrategy: 'copy-file',
    },
    command: {
      supported: false,
      reason:
        'Use Zed skills for slash commands; no independent command-file target is verified.',
    },
    subAgent: {
      supported: false,
      reason:
        'External agents and profiles do not define a Zed sub-agent asset-file format.',
    },
  };
}
